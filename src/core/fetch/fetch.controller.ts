import {Controller, Post} from "@nestjs/common";
import {FetchService} from "./fetch.service";
import {TestDto} from "src/shared/dto/test/test.dto";
import {v4} from "uuid";

@Controller()
export class FetchController {
    public constructor(private readonly fetchService: FetchService) {
    }

    @Post("call-raw")
    public async callRaw() {
        const dto = new TestDto();
        return this.fetchService.callRaw(dto, {}, v4());
    }

    @Post("call")
    public async call() {
        const dto = new TestDto();
        const res = await this.fetchService.call(dto, {}, v4());
        return res
    }
}
