import { SetMetadata } from "@nestjs/common";

export const NON_ENCRYPTION_KEY = Symbol("NON_ENCRYPTION_KEY");

export const NON_ENCRYPTION = SetMetadata(NON_ENCRYPTION_KEY, true);
