const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType } = require("@discordjs/voice");
const { SlashCommandBuilder } = require("discord.js");
const { join } = require('node:path');
const { createReadStream } = require('node:fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Joins your channel!"),
  async execute(interaction) {
    const message = await interaction.deferReply({
      fetchReply: true,
    });

    //console.log(generateDependencyReport());
    if (interaction.member.voice.channel) {
      try {
        
        const player = createAudioPlayer();
        //let resource = createAudioResource(createReadStream(join()`huh.mp3`));
        const resource = createAudioResource(createReadStream(join(__dirname, 'huh.mp3'), {
          inputType: StreamType.OggOpus,
        }));

        const voiceConnection = joinVoiceChannel({
          channelId: interaction.member.voice.channelId,
          guildId: interaction.guildId,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        player.play(resource);
        const sub = voiceConnection.subscribe(player);
        if (sub) {
          console.log("successfully subscribed!")
        }
        
        await interaction.editReply({
          content: `I'm connected to **${interaction.member.voice.channel.name}!**`,
        });

        voiceConnection.disconnect();


      } catch (error) {
        console.log(error);
        await interaction.editReply({
          content: `Something broke :c`,
        });
      }
    } else {
      await interaction.editReply({
        content: `**${interaction.member.nickname}** is not in a voice channel!`,
      });
    }
  },
};
