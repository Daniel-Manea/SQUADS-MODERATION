const { ApprovalButtons } = require('../components/buttons/approval');
const { ApprovalEmbed } = require('../components/embeds/approval');
const { ErrorEmbed } = require('../components/embeds/error');
const { MentionEmbed } = require('../components/embeds/mention');
const { RuleSelectMenu } = require('../components/select-menus/RuleSelectMenu');
const { getPunishments } = require('../database/getPunishments');
module.exports = {
    name: 'interactionCreate',
    execute(interaction) {
        if (
            (interaction.customId !== 'rule-select-soft' && interaction.customId !== 'rule-select-serious') &&
            (interaction.customId !== 'rule-select-temporary' && interaction.customId !== 'rule-select-permanent')
        ) return;

        let _approval = {
            _title: 'SE APLICARÁ',
            _type: null,
            _rule_id: null,
            _history: [],
        }

        switch (interaction.message.components[0].components[0].placeholder) {
            case 'LEVE':
                interaction.message.edit({ components: [RuleSelectMenu('soft')] });
                _selected_type = 'FALTA LEVE';
                _approval = {
                    _title: 'SE APLICARÁ UNA FALTA',
                    _type: 'LEVE',
                    _rule_id: interaction.values,
                    _history: [],
                }
                break;
            case 'GRAVE':
                interaction.message.edit({ components: [RuleSelectMenu('serious')] });
                _selected_type = 'FALTA GRAVE';
                _approval = {
                    _title: 'SE APLICARÁ UNA FALTA',
                    _type: 'GRAVE',
                    _rule_id: interaction.values,
                    _history: [],
                }
                break;
            case 'TEMPORAL':
                interaction.message.edit({ components: [RuleSelectMenu('temporary')] });
                _selected_type = 'BAN TEMPORAL';
                _approval = {
                    _title: 'SE APLICARÁ UN BAN',
                    _type: 'TEMPORAL',
                    _rule_id: interaction.values,
                    _history: [],
                }
                break;
            case 'PERMANENTE':
                interaction.message.edit({ components: [RuleSelectMenu('permanent')] });
                _selected_type = 'BAN PERMANENTE';
                _approval = {
                    _title: 'SE APLICARÁ UN BAN',
                    _type: 'PERMANENTE',
                    _rule_id: interaction.values,
                    _history: [],
                }
                break;
            default:
                break;
        }

        interaction.deferUpdate();

        let _embed_message_id;
        interaction.channel.send({ embeds: [MentionEmbed(_approval, _selected_type)] }).then(msg => {
            _embed_message_id = msg.id;
        });

        setTimeout(() => interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, { VIEW_CHANNEL: true, READ_MESSAGE_HISTORY: false }), 1000);

        interaction.channel.permissionOverwrites.create(interaction.user.id, { SEND_MESSAGES: true });

        const msg_filter = (m) => m.author.id === interaction.user.id;
        interaction.channel.awaitMessages({ filter: msg_filter, max: 1 }).then(async collected => {

            interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, { VIEW_CHANNEL: false, READ_MESSAGE_HISTORY: false });
            interaction.channel.permissionOverwrites.delete(interaction.user.id, { SEND_MESSAGES: false });

            const embed = await interaction.channel.messages.fetch(_embed_message_id);

            answerMessage = collected.first();
            _punished = answerMessage.mentions.users.first();
            if (answerMessage.content.replace(/[^0-9.]/g, '') === '' ||
                answerMessage.content.replace(/[^0-9.]/g, '').length < 17 ||
                answerMessage.content.replace(/[^0-9.]/g, '').length > 19 ||
                interaction.guild.channels.cache.get(answerMessage.content.replace(/[^0-9.]/g, ''))
            ) {
                answerMessage.delete();
                embed.edit({ embeds: [ErrorEmbed()] }).then(msg => {
                    setTimeout(() => msg.delete(), 3000);
                });
                return
            }

            if (!_punished) {
                _punished = {
                    id: answerMessage.content.replace(/[^0-9.]/g, '')
                }
            }

            const _punishments = await getPunishments(_punished.id);
            if (_punishments) {
                _punishments.forEach(_punishment => {
                    _approval._history.push({
                        _date: _punishment._date,
                        _rule_id: _punishment._rule_id,
                        _type: _punishment._type,
                        _log_message_url: _punishment._log_message_url,
                    })
                });
            }
            let _button_label
            let _button_emoji
            switch (_approval._type) {
                case 'LEVE':
                    _button_label = 'Aplicar falta leve'
                    _button_emoji = '<:FALTA_DANGER:1059189801082966037>'
                    break;
                case 'GRAVE':
                    _button_label = 'Aplicar falta grave'
                    _button_emoji = '<:FALTA_DANGER:1059189801082966037>'
                    break;
                case 'TEMPORAL':
                    _button_label = 'Banear temporalmente'
                    _button_emoji = '<:BAN_DANGER:1059189799573004349>'
                    break;
                case 'PERMANENTE':
                    _button_label = 'Banear permanentemente'
                    _button_emoji = '<:BAN_DANGER:1059189799573004349>'
                    break;
                default:
                    break;
            }
            embed.edit({ embeds: [ApprovalEmbed(_approval, _punished)], components: [ApprovalButtons(_approval._type, _button_emoji, _button_label)] }).then(answerMessage.delete())
        })
    }
}