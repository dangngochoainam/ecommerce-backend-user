import {Controller, Post} from "@nestjs/common";
import {FetchService} from "./fetch.service";
import {TestDto} from "src/shared/dto/test/test.dto";
import {v4} from "uuid";
import { NON_ENCRYPTION } from "../crypto/crypto.decorator";

@Controller()
export class FetchController {
    public constructor(private readonly fetchService: FetchService) {
    }

    @NON_ENCRYPTION
    @Post("call-raw")
    public async callRaw() {
        const dto = new TestDto();
        return this.fetchService.callRaw(dto, {}, v4());
    }

    @NON_ENCRYPTION
    @Post("call")
    public async call() {
        const dto = new TestDto();
        const res = await this.fetchService.call(dto, {}, v4());
        return res
    }
}
