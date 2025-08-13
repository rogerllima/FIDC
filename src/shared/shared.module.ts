import { Module } from "@nestjs/common";
import { DbService } from "./database/database";

@Module({
  providers: [DbService],
  exports: [DbService],
})
export class SharedModule {}
