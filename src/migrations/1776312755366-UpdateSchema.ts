import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSchema1776312755366 implements MigrationInterface {
    name = 'UpdateSchema1776312755366'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // no-op: changes already applied by migration 1776312285106
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // no-op
    }

}
