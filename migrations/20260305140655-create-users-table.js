"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      tenant_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "tenants",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      is_admin: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      is_email_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      avatar_filename: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null,
      },

      primary_position: {
        type: Sequelize.ENUM("GK", "DF", "MD", "FW"),
        allowNull: true,
        defaultValue: null,
      },

      secondary_position: {
        type: Sequelize.ENUM("GK", "DF", "MD", "FW"),
        allowNull: true,
        defaultValue: null,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
    });

    await queryInterface.addIndex("users", ["tenant_id"], {
      name: "users_tenant_id_idx",
    });

    await queryInterface.addIndex("users", ["email"], {
      unique: true,
      name: "users_email_unique",
    });

    await queryInterface.addIndex("users", ["deleted_at"], {
      name: "users_deleted_at_idx",
    });

    await queryInterface.addIndex("users", ["primary_position"], {
      name: "users_primary_position_idx",
    });

    await queryInterface.addIndex("users", ["secondary_position"], {
      name: "users_secondary_position_idx",
    });

    await queryInterface.addConstraint("users", {
      fields: ["tenant_id", "email"],
      type: "unique",
      name: "users_tenant_id_email_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("users");
  },
};
