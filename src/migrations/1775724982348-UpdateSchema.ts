import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSchema1775724982348 implements MigrationInterface {
    name = 'UpdateSchema1775724982348'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "articles_tag_list_tags" ("articlesId" integer NOT NULL, "tagsId" integer NOT NULL, CONSTRAINT "PK_a31848c989810ae15df2a000259" PRIMARY KEY ("articlesId", "tagsId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_77fbcba9604a1725f5ac5f5aac" ON "articles_tag_list_tags" ("articlesId") `);
        await queryRunner.query(`CREATE INDEX "IDX_92bf241babb02aca4f6a7e2d8c" ON "articles_tag_list_tags" ("tagsId") `);
        await queryRunner.query(`ALTER TABLE "articles_tag_list_tags" ADD CONSTRAINT "FK_77fbcba9604a1725f5ac5f5aaca" FOREIGN KEY ("articlesId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "articles_tag_list_tags" ADD CONSTRAINT "FK_92bf241babb02aca4f6a7e2d8cd" FOREIGN KEY ("tagsId") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "articles_tag_list_tags" DROP CONSTRAINT "FK_92bf241babb02aca4f6a7e2d8cd"`);
        await queryRunner.query(`ALTER TABLE "articles_tag_list_tags" DROP CONSTRAINT "FK_77fbcba9604a1725f5ac5f5aaca"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_92bf241babb02aca4f6a7e2d8c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_77fbcba9604a1725f5ac5f5aac"`);
        await queryRunner.query(`DROP TABLE "articles_tag_list_tags"`);
    }

}
