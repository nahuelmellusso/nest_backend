export type TransactionMock = {
  id: string;
  commit: jest.Mock<Promise<void>, []>;
  rollback: jest.Mock<Promise<void>, []>;
};

type MockSequelizeTransactionOptions = {
  shouldFail?: boolean;
  error?: Error;
};

export const mockSequelizeTransaction = (options: MockSequelizeTransactionOptions = {}) => {
  const transactionMock: TransactionMock = {
    id: "tx-1",
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
  };

  const transaction = jest.fn(async (callback: (t: TransactionMock) => any) => {
    if (options.shouldFail) {
      await transactionMock.rollback();
      throw options.error || new Error("Transaction failed");
    }

    const result = await callback(transactionMock);
    await transactionMock.commit();

    return result;
  });

  const sequelizeMock = {
    transaction,
  };

  return {
    sequelizeMock,
    transactionMock,
  };
};
