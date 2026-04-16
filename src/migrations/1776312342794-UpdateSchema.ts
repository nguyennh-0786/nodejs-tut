import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSchema1776312342794 implements MigrationInterface {
    name = 'UpdateSchema1776312342794'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "favorites" RENAME COLUMN "userName" TO "username"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "favorites" RENAME COLUMN "username" TO "userName"`);
    }

}
