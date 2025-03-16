import {Injectable} from "@nestjs/common";
import {Options} from "src/core/lock/mutex/configs";
import RedisMutex from "src/core/lock/mutex/redis-mutex";
import {ContextLogger, LoggerService} from "src/core/logger/logger.service";
import {AbstractRedisService} from "src/core/redis/base-redis.service";
import {delay} from "src/core/utils";
import {v4} from "uuid";

@Injectable()
export class RedisMutexService extends AbstractRedisService<"MUTEX"> {
    protected readonly NAMESPACE = "MUTEX";
}

@Injectable()
export class MutexService {
    protected logger!: ContextLogger;

    public constructor(
        protected readonly loggerService: LoggerService,
        private readonly redisMutexService: RedisMutexService,
    ) {
        this.logger = loggerService.newContextLogger(this.constructor.name);
    }

    public async getTimeoutLock(resource: string, timeoutMs: number) {
        const lockOptions: Options = {
            identifier: v4(),
            lockTimeout: timeoutMs,
            acquireTimeout: timeoutMs / 2,
            acquireAttemptsLimit: 5,
            retryInterval: 1000,
        };
        const mutex = new RedisMutex(this.redisMutexService.redisClient, resource, lockOptions);

        const acquire = await mutex.acquire();
        if (!acquire) {
            throw new Error(`Cannot acquire lock ${resource}`);
        }
        return mutex;
    }

    public async testMutex(resource: string, timeoutMs: number, handleTime: number) {
        const mutex = await this.getTimeoutLock(resource, timeoutMs);
        try {
            this.logger.info({traceId: resource}, "start handle task");
            await delay(handleTime);
            this.logger.info({traceId: resource}, "end handle task");
        } catch (error: any) {
            this.logger.error({traceId: resource}, error.message, error);
        } finally {
            this.logger.info({traceId: resource}, "finish handle task");
            await mutex.release();
        }
    }
}
