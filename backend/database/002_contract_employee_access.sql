CREATE TABLE ContractEmployeeAccess (
    NIP VARCHAR(50) NOT NULL PRIMARY KEY,
    Role VARCHAR(30) NOT NULL CONSTRAINT DF_ContractEmployeeAccess_Role DEFAULT 'HC',
    IsActive BIT NOT NULL CONSTRAINT DF_ContractEmployeeAccess_IsActive DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_ContractEmployeeAccess_CreatedAt DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_ContractEmployeeAccess_UpdatedAt DEFAULT SYSDATETIME(),
    CONSTRAINT CK_ContractEmployeeAccess_Role CHECK (Role IN ('ADMIN', 'HC'))
);
