const { getPunishmentById } = require('../database/getPunishments.js');
const { deletePunishment } = require('../database/deletePunishment.js');
const { Rules } = require('../libraries/rules.json');
const Roles = require('../libraries/roles_ids.json');

module.exports = {

    name: 'interactionCreate',
    async execute(interaction) {
        if (interaction.customId === 'revoke') {
            interaction.deferUpdate();
            if (interaction.member.roles.cache.has(Roles.Admin) || interaction.member.roles.cache.has(Roles.Supervisor)) {
                const _punishment = await getPunishmentById(interaction.message.embeds[0].fields[4].value.split(' ')[1]);
                let _punished_discord_user = interaction.guild.members.cache.get(_punishment._punished_id);

                // Try to remove the timeout from the user.
                if (_punishment._type === "LEVE" && (_punished_discord_user === null || _punished_discord_user === undefined)) {
                    interaction.member.send('No se ha podido eliminar la falta, lo más probable es que este usuario no esté en el servidor.');
                } else if (_punishment._type === "GRAVE" && (_punished_discord_user === null || _punished_discord_user === undefined)) {
                    interaction.member.send('No se ha podido eliminar la falta, lo más probable es que este usuario no esté en el servidor.');
                }
                if (_punishment._type === "GRAVE" && _punished_discord_user !== null && _punished_discord_user !== undefined) {
                    try {
                        _punished_discord_user.disableCommunicationUntil(null).then(() => {
                            // Send a message to the user that the punishment has been removed.
                            _punished_discord_user.send(`Se ha eliminado una falta a tu nombre con motivo: ${Rules[_punishment._rule_id - 1].description}.`);
                            deletePunishment(_punishment._id);
                            interaction.message.delete();
                        });
                    } catch (error) {
                        // console.log(error);
                        // interaction.member.send({ content: 'No se ha podido eliminar la falta.', ephemeral: true });
                    }
                } else if (_punishment._type === "LEVE" && (_punished_discord_user !== null && _punished_discord_user !== undefined)) {
                    try {
                        // Send a message to the user that the punishment has been removed.
                        _punished_discord_user.send(`Se ha eliminado una falta a tu nombre con motivo: ${Rules[_punishment._rule_id - 1].description}.`).then(() => {
                            deletePunishment(_punishment._id).then(() => {
                                interaction.message.delete();
                            });
                        });

                    } catch (error) {
                        interaction.member.send({ embeds: [ErrorEmbed('No se ha podido eliminar la falta')] })
                    }
                }

                if (_punishment._type === "TEMPORAL" || _punishment._type === "PERMANENTE") {

                    // Try to remove the ban from the user.
                    try {
                        interaction.guild.members.unban(_punishment._punished_id).then(() => {
                            deletePunishment(_punishment._id).then(() => {
                                interaction.message.delete();
                            });
                        }).catch((error) => {
                            if (error.code === 10026) {
                                interaction.member.send({ embeds: [ErrorEmbed('No se ha podido desbanear al usuario, ya que no se encuentra en la lista de baneados')] })
                            }
                        });
                    } catch (error) {
                        interaction.member.send({ embeds: [ErrorEmbed('No se ha podido desbanear al usuario')] })
                    }
                }

            } else {
                interaction.member.send({ embeds: [ErrorEmbed('No tienes permisos suficientes para quitar faltas, porfavor contácta a un @ADMINISTRADOR')] })
            }
        }

    }
}