import { Module } from "@nestjs/common";
import { ProducerService } from "./producer.service";
import { ConsumerService } from "./consumer.service";

@Module({
	imports: [],
	providers: [ProducerService, ConsumerService],
	exports: [ProducerService, ConsumerService],
})
export class AmqpModule {}
