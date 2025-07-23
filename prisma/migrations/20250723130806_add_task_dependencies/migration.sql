-- CreateTable
CREATE TABLE "TaskDependency" (
    "fromId" INTEGER NOT NULL,
    "toId" INTEGER NOT NULL,

    PRIMARY KEY ("fromId", "toId"),
    CONSTRAINT "TaskDependency_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Todo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TaskDependency_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Todo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
