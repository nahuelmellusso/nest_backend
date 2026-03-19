"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("teams", {
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

      name: {
        type: Sequelize.STRING(140),
        allowNull: false,
      },

      short_name: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },

      slug: {
        type: Sequelize.STRING(160),
        allowNull: false,
      },

      city: {
        type: Sequelize.STRING(120),
        allowNull: true,
        defaultValue: null,
      },

      country: {
        type: Sequelize.STRING(2),
        allowNull: false,
      },

      logo_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null,
      },

      founded_year: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
      },

      website_url: {
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

    await queryInterface.addIndex("teams", ["tenant_id"], {
      name: "teams_tenant_id_idx",
    });

    await queryInterface.addIndex("teams", ["name"], {
      name: "teams_name_idx",
    });

    await queryInterface.addIndex("teams", ["short_name"], {
      name: "teams_short_name_idx",
    });

    await queryInterface.addIndex("teams", ["country"], {
      name: "teams_country_idx",
    });

    await queryInterface.addIndex("teams", ["city"], {
      name: "teams_city_idx",
    });

    await queryInterface.addIndex("teams", ["is_active"], {
      name: "teams_is_active_idx",
    });

    await queryInterface.addIndex("teams", ["deleted_at"], {
      name: "teams_deleted_at_idx",
    });

    await queryInterface.addIndex("teams", ["tenant_id", "slug"], {
      unique: true,
      name: "teams_tenant_id_slug_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("teams");
  },
};
