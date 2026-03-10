"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "users",
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
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
          onUpdate: Sequelize.literal("CURRENT_TIMESTAMP"),
        },

        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
        },
      },
      {
        indexes: [
          {
            unique: true,
            fields: ["email"],
            name: "users_email_unique",
          },
          {
            fields: ["deleted_at"],
            name: "users_deleted_at_idx",
          },
          {
            fields: ["primary_position"],
            name: "users_primary_position_idx",
          },
          {
            fields: ["secondary_position"],
            name: "users_secondary_position_idx",
          },
        ],
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("users");
  },
};
