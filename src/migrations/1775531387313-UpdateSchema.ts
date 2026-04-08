import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSchema1775531387313 implements MigrationInterface {
    name = 'UpdateSchema1775531387313'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "FollowUser" ("username" character varying NOT NULL, "usernameFollow" character varying NOT NULL, CONSTRAINT "PK_4f15492a62989df9d343bf2ad64" PRIMARY KEY ("username", "usernameFollow"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d2edb5f097fcf1c92b908cf93f" ON "FollowUser" ("username") `);
        await queryRunner.query(`CREATE INDEX "IDX_7597aba10f6af6b13b3b86dfc9" ON "FollowUser" ("usernameFollow") `);
        await queryRunner.query(`ALTER TABLE "FollowUser" ADD CONSTRAINT "FK_d2edb5f097fcf1c92b908cf93fd" FOREIGN KEY ("username") REFERENCES "users"("username") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "FollowUser" ADD CONSTRAINT "FK_7597aba10f6af6b13b3b86dfc9b" FOREIGN KEY ("usernameFollow") REFERENCES "users"("username") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "FollowUser" DROP CONSTRAINT "FK_7597aba10f6af6b13b3b86dfc9b"`);
        await queryRunner.query(`ALTER TABLE "FollowUser" DROP CONSTRAINT "FK_d2edb5f097fcf1c92b908cf93fd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7597aba10f6af6b13b3b86dfc9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d2edb5f097fcf1c92b908cf93f"`);
        await queryRunner.query(`DROP TABLE "FollowUser"`);
    }

}
