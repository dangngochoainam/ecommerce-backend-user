export enum API_CHANNEL {
	APP = "app",
	WEB = "web",
	PRIVATE_EXTERNAL_API = "private-external-api",
	PRIVATE_INTERNAL_API = "private-internal-api",
	PROTECTED_ORG_API = "protected-org-api",
	PROTECTED_USER_API = "protected-user-api",
	INTERNAL_PORTAL = "internal-portal",
	INTERNAL_MS = "internal-ms",
	CORE = "core",
	RESOURCE = "resource",
}

export enum API_TOPIC {
	KYC = "kyc",
	CUSTOMER = "customer",
	LOS = "los",
	CONTRACT = "contract",
	CHAT = "chat",
	CHAT_INQUIRY = "chat-inquiry",
	LENDING = "lending",
	REPAYMENT = "repayment",
	STATEMENT = "statement",
}

export type ACCESS_MODIFIER = "private" | "public" | "protected" | "internal";

export function apiUrl<TOPIC>(format: {
	access_modifier: ACCESS_MODIFIER;
	channel: API_CHANNEL;
	topic: TOPIC;
	resource: string;
}): string {
	return `${format.access_modifier}/${format.channel}/${format.topic}/${format.resource}`;
}
