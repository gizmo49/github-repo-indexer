import { MigrationInterface, QueryRunner } from "typeorm";

export class RepoCommit1723515874880 implements MigrationInterface {
    name = 'RepoCommit1723515874880'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "repository_entity" ("id" SERIAL NOT NULL, "orgName" character varying, "repoName" character varying NOT NULL, "secret" character varying NOT NULL, "description" character varying, "url" character varying NOT NULL, "lastCommitUrl" character varying, "language" character varying, "forksCount" integer NOT NULL, "starsCount" integer NOT NULL, "openIssuesCount" integer NOT NULL, "watchersCount" integer NOT NULL, "indexingComplete" boolean NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5a277cb1f73162ceb6db9edc90f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "commit_entity" ("id" SERIAL NOT NULL, "commitMessage" character varying NOT NULL, "author" character varying NOT NULL, "commitDate" character varying NOT NULL, "commitUrl" character varying NOT NULL, "repositoryId" integer, CONSTRAINT "PK_e96aa453d186ae3404c6666e99d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "commit_entity" ADD CONSTRAINT "FK_3bc11cb77470efbd876829bfc45" FOREIGN KEY ("repositoryId") REFERENCES "repository_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "commit_entity" DROP CONSTRAINT "FK_3bc11cb77470efbd876829bfc45"`);
        await queryRunner.query(`DROP TABLE "commit_entity"`);
        await queryRunner.query(`DROP TABLE "repository_entity"`);
    }

}
