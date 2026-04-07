import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSchema1775553166985 implements MigrationInterface {
    name = 'UpdateSchema1775553166985'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "followUser" ("username" character varying NOT NULL, "usernameFollow" character varying NOT NULL, CONSTRAINT "PK_e4da82aba4fe5bb883f8bf21a6c" PRIMARY KEY ("username", "usernameFollow"))`);
        await queryRunner.query(`CREATE INDEX "IDX_527a524fa35170408cd994a242" ON "followUser" ("username") `);
        await queryRunner.query(`CREATE INDEX "IDX_fc7bb1c717bc57d0108837e5f1" ON "followUser" ("usernameFollow") `);
        await queryRunner.query(`ALTER TABLE "followUser" ADD CONSTRAINT "FK_527a524fa35170408cd994a242f" FOREIGN KEY ("username") REFERENCES "users"("username") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "followUser" ADD CONSTRAINT "FK_fc7bb1c717bc57d0108837e5f1e" FOREIGN KEY ("usernameFollow") REFERENCES "users"("username") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "followUser" DROP CONSTRAINT "FK_fc7bb1c717bc57d0108837e5f1e"`);
        await queryRunner.query(`ALTER TABLE "followUser" DROP CONSTRAINT "FK_527a524fa35170408cd994a242f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fc7bb1c717bc57d0108837e5f1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_527a524fa35170408cd994a242"`);
        await queryRunner.query(`DROP TABLE "followUser"`);
    }

}
