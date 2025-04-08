import { DynamicModule, Global, Inject, Injectable, Module, ModuleMetadata, OnModuleInit, Type } from "@nestjs/common";
import { ConsumerService } from "../amqp/consumer.service";
import { ContextLogger, LoggerService } from "../logger/logger.service";
import { DISTRIBUTOR_TOKEN, DistributorService } from "./distributor/distributor.service";
import { Schedule } from "./schedule";
import { WorkflowHelperService } from "./workflow-helper.service";
import { DEF, IMessageEvent, RootMsg, RUN_RESULT } from "./workflow-type";

@Injectable()
export abstract class AbstractWorkflowService implements OnModuleInit {
	protected readonly logger!: ContextLogger;

	public abstract readonly name: string;
	public abstract readonly schedule: Schedule;

	public abstract readonly DEF: DEF;

	public constructor(protected readonly loggerService: LoggerService) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	@Inject()
	protected readonly workflowHelperService!: WorkflowHelperService;

	@Inject()
	protected readonly consumerService!: ConsumerService;

	public async onModuleInit(): Promise<void> {
		await this.listen();
	}

	private async listen() {
		const { source } = await this.consumerService.receiveMessage<RootMsg>({
			address: {
				name: this.DEF.address,
				options: {
					durable: true,
				},
			},
			exchange: {
				name: this.DEF.exchange,
				routingKey: this.name,
				fanout: false,
				options: {
					durable: true,
				},
			},
			durable: true,
			concurrentLimit: 1,
		});

		source.forEach(async (message) => {
			await this.execute(message);
		});
	}

	// handle flow of workflow
	private async execute(msg: IMessageEvent<RootMsg>) {
		this.logger.log({}, `[Execute] Distributor request execute ${JSON.stringify(msg)}`);
		const res = await this.run();
		console.log(res);
	}

	//TODO: Business logic of each wf
	protected abstract run(): Promise<RUN_RESULT>;

	public static createModule<T extends AbstractWorkflowService>(
		service: Type<T>,
		metadata?: ModuleMetadata,
	): DynamicModule {
		@Global()
		@Module({})
		class M {}
		return {
			global: true,
			module: M,
			imports: [...(metadata?.imports || [])],
			providers: [
				service,
				{
					provide: DISTRIBUTOR_TOKEN,
					useExisting: service,
				},
				DistributorService,
				...(metadata?.providers || []),
			],
			exports: [service],
		};
	}
}
