import { TransformFnParams } from "class-transformer";

export function stringToBoolean(value: any): boolean {
	if (typeof value === "string") {
		return value.toLowerCase() === "true";
	}
	return value;
}

export function optionalStringToBoolean(data: TransformFnParams): boolean {
	if (!data.value) {
		return false;
	}
	return stringToBoolean(data.value);
}
