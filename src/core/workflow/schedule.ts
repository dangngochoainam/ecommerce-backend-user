export abstract class Schedule {
	/**
	 * dynamicEager mean that the scheduler would run eagerly if
	 * the system workload is low (aggregated base number of running items)
	 */
	public abstract readonly dynamicEager: boolean;

	/**
	 * Minimal number of minute after the workflow item which failed to execute
	 * have to wait before it could be distributed again. (status is PROCESSING)
	 * Based on last update_date
	 */
	public abstract readonly executeGapInMinute: number;
}

export class IntervalSchedule extends Schedule {
	constructor(
		public intervalInSeconds: number,
		public executeGapInMinute: number,
		public dynamicEager: boolean,
	) {
		super();
	}
}

export class CronSchedule extends Schedule {
	public readonly dynamicEager = false;

	constructor(
		public cronPattern: string,
		public executeGapInMinute: number,
	) {
		super();
	}
}
