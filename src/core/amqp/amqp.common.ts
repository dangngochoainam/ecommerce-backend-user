import { Options } from "amqplib";

export enum QUEUE_ATTRIBUTE_KEY {
	QUEUE_TYPE = "x-queue-type",
	QUEUE_VERSION = "x-queue-version",
}

export interface IExchange {
	name: string;
	routingKey: string;
	fanout: boolean;
	options?: Options.AssertExchange;
}

export interface IAddress {
	name: string;
	options?: Options.AssertQueue;
}

export interface ISendMessage {
	address: string;
	message: string | Buffer;
	traceId: string;
	messageId: string;
	durable: boolean;
	replyTo?: {
		address: string;
		// Id of the sender of this message
		id: string;
	};
	// Id of the expected receiver of this message
	receiverId?: string;
}

export const TEMPORARY_QUEUE_LIFETIME = 60 * 60 * 24;
