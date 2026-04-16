import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSchema1776312285106 implements MigrationInterface {
    name = 'UpdateSchema1776312285106'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "favorites" ADD "userName" character varying`);
        await queryRunner.query(`UPDATE "favorites" f SET "userName" = u.username FROM "users" u WHERE f."userId"::integer = u.id`);
        await queryRunner.query(`UPDATE "favorites" SET "userName" = '' WHERE "userName" IS NULL`);
        await queryRunner.query(`ALTER TABLE "favorites" ALTER COLUMN "userName" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "favorites" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "favorites" DROP CONSTRAINT "FK_a9e25be94f65c6f11f420d97bca"`);
        await queryRunner.query(`ALTER TABLE "favorites" ALTER COLUMN "articleId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "favorites" ADD CONSTRAINT "FK_a9e25be94f65c6f11f420d97bca" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "favorites" DROP CONSTRAINT "FK_a9e25be94f65c6f11f420d97bca"`);
        await queryRunner.query(`ALTER TABLE "favorites" ALTER COLUMN "articleId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "favorites" ADD CONSTRAINT "FK_a9e25be94f65c6f11f420d97bca" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "favorites" DROP COLUMN "userName"`);
        await queryRunner.query(`ALTER TABLE "favorites" ADD "userId" character varying NOT NULL`);
    }

}
