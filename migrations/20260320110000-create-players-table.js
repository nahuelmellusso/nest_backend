"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("players", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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
      first_name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING(120),
        allowNull: true,
        defaultValue: null,
      },
      full_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      birth_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null,
      },
      nationality: {
        type: Sequelize.STRING(2),
        allowNull: true,
        defaultValue: null,
      },
      position: {
        type: Sequelize.STRING(80),
        allowNull: true,
        defaultValue: null,
      },
      photo_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      deleted_at: {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: null,
      },
    });

    await queryInterface.addIndex("players", ["tenant_id"], { name: "players_tenant_id_idx" });
    await queryInterface.addIndex("players", ["user_id"], { name: "players_user_id_idx" });
    await queryInterface.addIndex("players", ["full_name"], { name: "players_full_name_idx" });
    await queryInterface.addIndex("players", ["nationality"], { name: "players_nationality_idx" });
    await queryInterface.addIndex("players", ["position"], { name: "players_position_idx" });
    await queryInterface.addIndex("players", ["deleted_at"], { name: "players_deleted_at_idx" });
    await queryInterface.addIndex("players", ["tenant_id", "user_id"], {
      unique: true,
      name: "players_tenant_user_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("players");
  },
};
