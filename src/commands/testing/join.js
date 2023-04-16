const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  StreamType,
  VoiceConnectionStatus,
  AudioPlayerStatus,
} = require("@discordjs/voice");
const { SlashCommandBuilder } = require("discord.js");
const { join } = require("node:path");
const { createReadStream } = require("node:fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Joins your channel!"),
  async execute(interaction) {
    const message = await interaction.deferReply({
      fetchReply: true,
    });

    if (interaction.member.voice.channel) {
      try {
        const player = createAudioPlayer();
        const voiceConnection = joinVoiceChannel({
          channelId: interaction.member.voice.channelId,
          guildId: interaction.guildId,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        voiceConnection.on(VoiceConnectionStatus.Ready, () => {
          const resource = createAudioResource(
            createReadStream(join(__dirname, "../../../media/jdaebot.mp3"), {
              inputType: StreamType.OggOpus,
            })
          );
          player.play(resource);
        });

        const sub = voiceConnection.subscribe(player);
        if (sub) {
          console.log("successfully subscribed!");
        }

        player.on(AudioPlayerStatus.Idle, () => {
          setTimeout(() => {
            voiceConnection.disconnect();
          }, 3000);
        });

        await interaction.editReply({
          content: `I'm connected to **${interaction.member.voice.channel.name}!**`,
        });

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
