'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      Id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      UserName: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      Email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      PasswordHash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      PhoneNumber: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
    });

    await queryInterface.createTable('Roles', {
      Id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      Name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
    });

    await queryInterface.createTable('UserRoles', {
      UserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'Users',
          key: 'Id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      RoleId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'Roles',
          key: 'Id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    });

    await queryInterface.createTable('UserClaims', {
      Id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      UserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'Id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      ClaimType: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      ClaimValue: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
    });

    await queryInterface.createTable('UserTokens', {
      UserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'Users',
          key: 'Id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      LoginProvider: {
        type: Sequelize.STRING(128),
        allowNull: false,
        primaryKey: true,
      },
      Name: {
        type: Sequelize.STRING(128),
        allowNull: false,
        primaryKey: true,
      },
      Value: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    });

    await queryInterface.createTable('RefreshTokens', {
      Id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      Token: {
        type: Sequelize.STRING(500),
        allowNull: false,
        unique: true,
      },
      Expires: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      Created: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      Revoked: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      UserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'Id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    });
    await queryInterface.createTable('Patients', {
  Id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  FirstName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  LastName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  Phone: {
    type: Sequelize.STRING,
  },
  DateOfBirth: {
    type: Sequelize.DATE,
  },
  Gender: {
    type: Sequelize.STRING,
  },
  Address: {
    type: Sequelize.STRING,
  },
  EmergencyContact: {
    type: Sequelize.STRING,
  },
  RegistrationDate: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
});

await queryInterface.createTable('Therapists', {
  Id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  FirstName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  LastName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  Phone: {
    type: Sequelize.STRING,
  },
  Specialization: {
    type: Sequelize.STRING,
  },
  LicenseNumber: {
    type: Sequelize.STRING,
  },
  Qualifications: {
    type: Sequelize.TEXT,
  },
  EmploymentDate: {
    type: Sequelize.DATE,
  },
  Biography: {
    type: Sequelize.TEXT,
  },
});
  },

  async down(queryInterface) {
     await queryInterface.dropTable('Therapists');
  await queryInterface.dropTable('Patients');
    await queryInterface.dropTable('RefreshTokens');
    await queryInterface.dropTable('UserTokens');
    await queryInterface.dropTable('UserClaims');
    await queryInterface.dropTable('UserRoles');
    await queryInterface.dropTable('Roles');
    await queryInterface.dropTable('Users');
  },
};
