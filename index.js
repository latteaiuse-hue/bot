// discord.js v14 サンプル
// 必要: npm i discord.js
// 環境変数: TOKEN, GUILD_ID, CATEGORY_ID
const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  MessageFlags,
} = require('discord.js');
const TOKEN = "MTU1NjYwNjk0NzU4MTQ5MzM5MA.GSNJ_L.J4R3oVe6i38Letvc99QDOf5ZZLkuDC7AGBg5Q0";
const GUILD_ID = "1475858747283738689";
const CATEGORY_ID = "1556579219637538878";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const command = new SlashCommandBuilder()
  .setName('mychannel')
  .setDescription('自分専用の発言チャンネルを作成します');

client.once('clientReady', async () => {
  // サーバー限定コマンドとして登録（即時反映）
  const guild = await client.guilds.fetch(GUILD_ID);
  await guild.commands.set([command.toJSON()]);
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'mychannel') return;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const guild = interaction.guild;
  const member = interaction.member;

  // 作成済みチェック：トピックに所有者IDを保存して判定
  const channels = await guild.channels.fetch();
  const existing = channels.find(
    (c) => c && c.parentId === CATEGORY_ID && c.topic === `owner:${member.id}`
  );
  if (existing) {
    return interaction.editReply(`すでに作成済みです: ${existing}`);
  }

  // チャンネル名（空になった場合はIDで代替）
  const name =
    member.displayName.replace(/[^\p{L}\p{N}_-]/gu, '-').slice(0, 90) ||
    member.id;

  try {
    const channel = await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: CATEGORY_ID,
      topic: `owner:${member.id}`,
      permissionOverwrites: [
        {
          // 全員：閲覧OK・通常発言NG・スレッド内発言OK
          id: guild.roles.everyone.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.SendMessagesInThreads,
            PermissionFlagsBits.CreatePublicThreads,
          ],
          deny: [PermissionFlagsBits.SendMessages],
        },
        {
          // 作成者：発言OK
          id: member.id,
          allow: [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.ManageThreads,
          ],
        },
        {
          // Bot自身
          id: client.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels,
          ],
        },
      ],
    });

    await interaction.editReply(`作成しました: ${channel}`);
  } catch (err) {
    console.error(err);
    await interaction.editReply('作成に失敗しました。Botの権限と上限を確認してください。');
  }
});

client.login(TOKEN);