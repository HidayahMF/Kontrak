CREATE TABLE EmployeeContracts (
    Id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    NIP VARCHAR(50) NOT NULL,
    EmployeeNameSnapshot NVARCHAR(200) NOT NULL,
    ContractStartDate DATE NOT NULL,
    ContractEndDate DATE NOT NULL,
    CreatedByNIP VARCHAR(50) NOT NULL,
    UpdatedByNIP VARCHAR(50) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_EmployeeContracts_CreatedAt DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_EmployeeContracts_UpdatedAt DEFAULT SYSDATETIME(),
    CONSTRAINT CK_EmployeeContracts_Dates CHECK (ContractEndDate >= ContractStartDate)
);
CREATE INDEX IX_EmployeeContracts_NIP ON EmployeeContracts (NIP);
CREATE INDEX IX_EmployeeContracts_Dates ON EmployeeContracts (ContractStartDate, ContractEndDate);
