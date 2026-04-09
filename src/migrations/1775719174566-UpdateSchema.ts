import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSchema1775719174566 implements MigrationInterface {
    name = 'UpdateSchema1775719174566'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "followUser" DROP CONSTRAINT "FK_527a524fa35170408cd994a242f"`);
        await queryRunner.query(`ALTER TABLE "followUser" DROP CONSTRAINT "FK_fc7bb1c717bc57d0108837e5f1e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_527a524fa35170408cd994a242"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fc7bb1c717bc57d0108837e5f1"`);
        await queryRunner.query(`ALTER TABLE "followUser" DROP CONSTRAINT "PK_e4da82aba4fe5bb883f8bf21a6c"`);
        await queryRunner.query(`ALTER TABLE "followUser" ADD CONSTRAINT "PK_fc7bb1c717bc57d0108837e5f1e" PRIMARY KEY ("usernameFollow")`);
        await queryRunner.query(`ALTER TABLE "followUser" DROP COLUMN "username"`);
        await queryRunner.query(`ALTER TABLE "followUser" DROP CONSTRAINT "PK_fc7bb1c717bc57d0108837e5f1e"`);
        await queryRunner.query(`ALTER TABLE "followUser" DROP COLUMN "usernameFollow"`);
        await queryRunner.query(`ALTER TABLE "followUser" ADD "userId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "followUser" ADD CONSTRAINT "PK_c9d708313d6fe305efe8595e525" PRIMARY KEY ("userId")`);
        await queryRunner.query(`ALTER TABLE "followUser" ADD "followUserId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "followUser" DROP CONSTRAINT "PK_c9d708313d6fe305efe8595e525"`);
        await queryRunner.query(`ALTER TABLE "followUser" ADD CONSTRAINT "PK_25a262c72c5b713bcb2d6cbaddd" PRIMARY KEY ("userId", "followUserId")`);
        await queryRunner.query(`CREATE INDEX "IDX_c9d708313d6fe305efe8595e52" ON "followUser" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_66bc1ca0081aa49d4d8a5ae3c7" ON "followUser" ("followUserId") `);
        await queryRunner.query(`ALTER TABLE "followUser" ADD CONSTRAINT "FK_c9d708313d6fe305efe8595e525" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "followUser" ADD CONSTRAINT "FK_66bc1ca0081aa49d4d8a5ae3c79" FOREIGN KEY ("followUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "followUser" DROP CONSTRAINT "FK_66bc1ca0081aa49d4d8a5ae3c79"`);
        await queryRunner.query(`ALTER TABLE "followUser" DROP CONSTRAINT "FK_c9d708313d6fe305efe8595e525"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_66bc1ca0081aa49d4d8a5ae3c7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c9d708313d6fe305efe8595e52"`);
        await queryRunner.query(`ALTER TABLE "followUser" DROP CONSTRAINT "PK_25a262c72c5b713bcb2d6cbaddd"`);
        await queryRunner.query(`ALTER TABLE "followUser" ADD CONSTRAINT "PK_c9d708313d6fe305efe8595e525" PRIMARY KEY ("userId")`);
        await queryRunner.query(`ALTER TABLE "followUser" DROP COLUMN "followUserId"`);
        await queryRunner.query(`ALTER TABLE "followUser" DROP CONSTRAINT "PK_c9d708313d6fe305efe8595e525"`);
        await queryRunner.query(`ALTER TABLE "followUser" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "followUser" ADD "usernameFollow" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "followUser" ADD CONSTRAINT "PK_fc7bb1c717bc57d0108837e5f1e" PRIMARY KEY ("usernameFollow")`);
        await queryRunner.query(`ALTER TABLE "followUser" ADD "username" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "followUser" DROP CONSTRAINT "PK_fc7bb1c717bc57d0108837e5f1e"`);
        await queryRunner.query(`ALTER TABLE "followUser" ADD CONSTRAINT "PK_e4da82aba4fe5bb883f8bf21a6c" PRIMARY KEY ("username", "usernameFollow")`);
        await queryRunner.query(`CREATE INDEX "IDX_fc7bb1c717bc57d0108837e5f1" ON "followUser" ("usernameFollow") `);
        await queryRunner.query(`CREATE INDEX "IDX_527a524fa35170408cd994a242" ON "followUser" ("username") `);
        await queryRunner.query(`ALTER TABLE "followUser" ADD CONSTRAINT "FK_fc7bb1c717bc57d0108837e5f1e" FOREIGN KEY ("usernameFollow") REFERENCES "users"("username") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "followUser" ADD CONSTRAINT "FK_527a524fa35170408cd994a242f" FOREIGN KEY ("username") REFERENCES "users"("username") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

}
