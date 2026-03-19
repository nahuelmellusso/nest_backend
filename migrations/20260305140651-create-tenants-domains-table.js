"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tenant_domains", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
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

      host: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },

      type: {
        type: Sequelize.ENUM("system_subdomain", "custom_domain"),
        allowNull: false,
      },

      is_primary: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      is_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      verification_token: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null,
      },

      verified_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },

      status: {
        type: Sequelize.ENUM("pending", "active", "disabled", "failed"),
        allowNull: false,
        defaultValue: "active",
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

    await queryInterface.addIndex("tenant_domains", ["tenant_id"], {
      name: "tenant_domains_tenant_id_idx",
    });

    await queryInterface.addIndex("tenant_domains", ["host"], {
      unique: true,
      name: "tenant_domains_host_unique",
    });

    await queryInterface.addIndex("tenant_domains", ["status"], {
      name: "tenant_domains_status_idx",
    });

    await queryInterface.addIndex("tenant_domains", ["deleted_at"], {
      name: "tenant_domains_deleted_at_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("tenant_domains");
  },
};
