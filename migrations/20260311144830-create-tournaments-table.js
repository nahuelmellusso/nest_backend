"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tournaments", {
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

      sport_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "sports",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },

      slug: {
        type: Sequelize.STRING(140),
        allowNull: false,
      },

      type: {
        type: Sequelize.ENUM("league", "cup", "group_stage", "playoff", "friendly"),
        allowNull: false,
      },

      country: {
        type: Sequelize.STRING(2),
        allowNull: false,
      },

      image: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null,
      },

      settings: {
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

    await queryInterface.addIndex("tournaments", ["tenant_id"], {
      name: "tournaments_tenant_id_idx",
    });

    await queryInterface.addIndex("tournaments", ["sport_id"], {
      name: "tournaments_sport_id_idx",
    });

    await queryInterface.addIndex("tournaments", ["name"], {
      name: "tournaments_name_idx",
    });

    await queryInterface.addIndex("tournaments", ["country"], {
      name: "tournaments_country_idx",
    });

    await queryInterface.addIndex("tournaments", ["type"], {
      name: "tournaments_type_idx",
    });

    await queryInterface.addIndex("tournaments", ["is_active"], {
      name: "tournaments_is_active_idx",
    });

    await queryInterface.addIndex("tournaments", ["deleted_at"], {
      name: "tournaments_deleted_at_idx",
    });

    await queryInterface.addIndex("tournaments", ["tenant_id", "slug"], {
      unique: true,
      name: "tournaments_tenant_id_slug_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("tournaments");
  },
};
