"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("notifications", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      tenant_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      type: {
        type: Sequelize.ENUM("user_registered", "match_rescheduled", "registration_approved"),
        allowNull: false,
      },
      title: { type: Sequelize.STRING(160), allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: false },
      link: { type: Sequelize.STRING(255), allowNull: true, defaultValue: null },
      data: { type: Sequelize.JSON, allowNull: true, defaultValue: null },
      read_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      deleted_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
    });

    await queryInterface.addIndex("notifications", ["tenant_id"], {
      name: "notifications_tenant_id_idx",
    });
    await queryInterface.addIndex("notifications", ["user_id"], {
      name: "notifications_user_id_idx",
    });
    await queryInterface.addIndex("notifications", ["type"], { name: "notifications_type_idx" });
    await queryInterface.addIndex("notifications", ["read_at"], {
      name: "notifications_read_at_idx",
    });
    await queryInterface.addIndex("notifications", ["deleted_at"], {
      name: "notifications_deleted_at_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("notifications");
  },
};
