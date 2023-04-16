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
const textToSpeech = require("@google-cloud/text-to-speech");
const fs = require("fs");
const util = require("util");
require("dotenv").config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("speak")
    .setDescription("Speak some words!")
    .addStringOption((option) =>
      option
        .setName('input')
        .setDescription("What do you want me to say?")
        .setRequired(true)
    ),
  async execute(interaction) {
    const message = await interaction.deferReply({
      fetchReply: true,
    });

    if (interaction.member.id === "183372080165683200") {
      if (interaction.member.voice.channel) {
        const ttsClient = new textToSpeech.TextToSpeechClient();
        console.log("ttsClient made...");
          const text = interaction.options.getString('input')
          const request = {
            input: { text: text },
            voice: { languageCode: "en-US", name: "en-US-Neural2-F" },
            audioConfig: {
              audioEncoding: "MP3",
              pitch: 1.2,
              speakingRate: 1.23,
              effectsProfileId: ["small-bluetooth-speaker-class-device"],
            },
          };
          console.log("response sent...");
          const [response] = await ttsClient.synthesizeSpeech(request);
          console.log("repsonse recieved!");
           const resource = createAudioResource(
            createReadStream(join(__dirname, "output.mp3"), {
              inputType: StreamType.OggOpus,
            })
          );
          const writeFile = util.promisify(fs.writeFile);
          await writeFile(
            "src/commands/testing/output.mp3",
            response.audioContent,
            "binary"
          );
          console.log("audio successfully sorted");

        try {
          const player = createAudioPlayer();
          const voiceConnection = joinVoiceChannel({
            channelId: interaction.member.voice.channelId,
            guildId: interaction.guildId,
            adapterCreator: interaction.guild.voiceAdapterCreator,
          });

          voiceConnection.on(VoiceConnectionStatus.Ready, () => {
            player.play(resource);
          });

          const sub = voiceConnection.subscribe(player);
          if (sub) {
            console.log("successfully subscribed!");
          }

          player.on(AudioPlayerStatus.Idle, () => {
            setTimeout(() => {
              voiceConnection.disconnect();
            }, 2000);
            try {
              fs.unlinkSync("src/commands/testing/output.mp3", function(){});
            } catch (error) {
              console.log(error);
            }
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
    } else {
      await interaction.editReply({
        content: `Sowwy, ${interaction.member.nickname}, but due to rate limit prices of the the TTS, I can't let you play with this just yet TwT`,
      });
    }
  },
};
