import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSchema1775466421161 implements MigrationInterface {
    name = 'UpdateSchema1775466421161'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "bio" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "image" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "image"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "bio"`);
    }

}
