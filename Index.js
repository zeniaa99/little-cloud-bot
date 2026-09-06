const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Little Cloud Shop Bot is Online!'));
app.listen(process.env.PORT || 3000, () => console.log('Web server is ready!'));
const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    AttachmentBuilder,
    ButtonBuilder,       
    ButtonStyle          
} = require('discord.js');
const fs = require('fs'); 
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// 📌 1. เบอร์พร้อมเพย์
const PROMPTPAY_NUMBER = '0984637074'; 

// 📌 2. ไอดีของยศ Customer
const CUSTOMER_ROLE_ID = '1539220153345245235';

// 📌 3. ฐานข้อมูลร้านค้า
const dataPath = './shopData.json';
let shopData = {};

if (fs.existsSync(dataPath)) {
    shopData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} else {
    shopData = { 
        heavy: { name: 'Heavy City', price: 75, stock: 37, extra: '', emoji: '<:HEAVY_1000:1540800612927545465>' },
        sakura: { name: 'Sakura Town', price: 90, stock: 7, extra: '', emoji: '<:Sakura_Newlogo:1540800644481552404>' },
        we: { name: 'We City', price: 115, stock: 2, extra: 'ชุดตี +1', emoji: '<:wev2:1540800568480636949>' },
        happy: { name: 'Happy Community', price: 200, stock: 6, extra: '', emoji: '<:happy:1543559580729090048>' }
    };
    saveShopData();
}

function saveShopData() { fs.writeFileSync(dataPath, JSON.stringify(shopData, null, 2)); }

function generateShopEmbed() {
    let description = '';
    for (const [key, city] of Object.entries(shopData)) {
        const extraText = city.extra ? ` ${city.extra}` : '';
        const cityEmoji = city.emoji ? city.emoji : '📌'; 
        
        description += `${cityEmoji} **${city.name}** เงินเขียว 1 M. \`${city.price} B.-\` พร้อมส่ง **${city.stock}m**${extraText}\n\n`;
    }
    
    if (description === '') description = '❌ ยังไม่มีข้อมูลเมือง พิมพ์ `!addcity` เพื่อเพิ่มเมืองครับ';
    
    return new EmbedBuilder()
        .setTitle('🌈🐰 𝐋𝐢𝐭𝐭𝐥𝐞 𝐂𝐥𝐨𝐮𝐝 𝐒𝐡𝐨𝐩 🐰🌈')
        .setDescription(description)
        .setColor('#d2eaf9');
}

// 📌 ฟังก์ชันตัวช่วยสำหรับส่งข้อมูลรายเมือง (คำสั่งลัด)
async function sendCityInfo(message, cityKey) {
    const city = shopData[cityKey];
    if (!city) return;
    
    const extraText = city.extra ? ` ${city.extra}` : '';
    const cityEmoji = city.emoji ? city.emoji : '📌'; 
    
    const embed = new EmbedBuilder()
        .setDescription(`${cityEmoji} **${city.name}** เงินเขียว 1 M. \`${city.price} B.-\` พร้อมส่ง **${city.stock}m**${extraText}`)
        .setColor('#d2eaf9');
    
    await message.channel.send({ embeds: [embed] });
    await message.delete().catch(()=>{});
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // ทำให้ข้อความที่พิมพ์มาเป็นตัวเล็กทั้งหมด จะได้จับคำสั่งง่ายขึ้น
    const msgText = message.content.toLowerCase().trim();

    // ==========================================
    // 📌 ระบบคำสั่งลัดรายเมือง (h, s, w, happy)
    // ==========================================
    if (msgText === 'h') return sendCityInfo(message, 'heavy');
    if (msgText === 's') return sendCityInfo(message, 'sakura');
    if (msgText === 'w') return sendCityInfo(message, 'we');
    if (msgText === 'happy') return sendCityInfo(message, 'happy');

    // ==========================================
    // 📌 คำสั่งหลักของระบบ
    // ==========================================
    if (message.content === '!pay') {
        const embed = new EmbedBuilder()
            .setTitle('ชำระเงินผ่านระบบอัตโนมัติ')
            .setDescription('**โอนผ่านทรูวอเล็ตบวกเพิ่ม 15 บาททุกกรณี!!**\n\n- ตรวจสอบยอดเงินให้ถูกต้อง')
            .setImage('https://via.placeholder.com/600x300.png?text=PromptPay+Banner') 
            .setColor('#ffb6c1');

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('payment_method')
                .setPlaceholder('กรุณาเลือกช่องทางการชำระเงิน')
                .addOptions([
                    { label: 'PromptPay', description: 'ระบุจำนวนเงินเพื่อสร้าง QR Code พร้อมเพย์', value: 'promptpay_custom', emoji: '🪪' },
                    { label: 'ยกเลิก / ล้างตัวเลือก', description: 'รีเซ็ตเมนูเพื่อกดเลือกใหม่', value: 'clear_selection', emoji: '❌' }
                ])
        );

        await message.channel.send({ embeds: [embed], components: [row] });
        await message.delete().catch(() => {});
    }

    if (message.content === '!shop') {
        await message.channel.send({ 
            content: `<@&${CUSTOMER_ROLE_ID}>`, 
            embeds: [generateShopEmbed()] 
        });
        await message.delete().catch(()=>{});
    }

    if (message.content === '!update') {
        const options = Object.entries(shopData).map(([key, city]) => ({ label: city.name, value: key, emoji: '📌' }));
        if (options.length === 0) return message.channel.send('❌ ไม่มีเมืองให้อัปเดต พิมพ์ `!addcity`');
        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('select_city_update').setPlaceholder('เลือกเมือง').addOptions(options.slice(0, 25))
        );
        await message.channel.send({ content: '🛠️ **เลือกร้านค้าเพื่ออัปเดต:**', components: [row] });
        await message.delete().catch(()=>{});
    }

    if (message.content === '!addcity') {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_addcity').setLabel('เพิ่มเมืองใหม่').setStyle(ButtonStyle.Success).setEmoji('➕')
        );
        await message.channel.send({ content: 'คลิกปุ่มด้านล่างเพื่อเพิ่มข้อมูลเมืองใหม่ 👇', components: [row] });
        await message.delete().catch(()=>{});
    }
});

client.on('interactionCreate', async interaction => {
    
    if (interaction.isButton()) {
        if (interaction.customId === 'btn_addcity') {
            const modal = new ModalBuilder().setCustomId('modal_addcity').setTitle('เพิ่มเมืองใหม่เข้าระบบ');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_name').setLabel('ชื่อเมือง').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_price').setLabel('ราคาต่อ 1M').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_stock').setLabel('จำนวนพร้อมส่ง').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_extra').setLabel('ข้อความเพิ่มเติม (ไม่บังคับ)').setStyle(TextInputStyle.Short).setRequired(false)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_emoji').setLabel('ไอคอน (เช่น 🏙️ หรือ <:id:>)').setStyle(TextInputStyle.Short).setRequired(false))
            );
            await interaction.showModal(modal);
        }
        else if (interaction.customId === 'reenter_amount') {
            const modal = new ModalBuilder().setCustomId('promptpay_modal').setTitle('ระบุจำนวนเงินที่ต้องการชำระใหม่');
            const amountInput = new TextInputBuilder().setCustomId('amount_input').setLabel('จำนวนเงิน (บาท)').setStyle(TextInputStyle.Short).setPlaceholder('กรอกตัวเลข เช่น 100').setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(amountInput));
            await interaction.showModal(modal);
        } 
        else if (interaction.customId === 'cancel_payment') {
            await interaction.update({ content: '❌ **ยกเลิกรายการชำระเงินเรียบร้อยแล้ว**', embeds: [], files: [], components: [] });
        }
        else if (interaction.customId === 'paid_success') {
            const successEmbed = new EmbedBuilder().setTitle('✅ รอการตรวจสอบสลิป').setDescription('**ระบบได้รับแจ้งการชำระเงินของคุณแล้ว**\n\n📌 กรุณา **แนบรูปภาพสลิปหลักฐานการโอนเงิน** ลงในห้องแชทนี้ เพื่อให้แอดมินตรวจสอบและดำเนินการต่อได้เลย').setColor('#00ff00');
            await interaction.update({ embeds: [successEmbed], files: [], components: [] });
        }
    }

    else if (interaction.isStringSelectMenu()) {
        const selected = interaction.values[0];

        if (interaction.customId === 'payment_method') {
            if (selected === 'promptpay_custom') {
                const modal = new ModalBuilder().setCustomId('promptpay_modal').setTitle('ระบุจำนวนเงินที่ต้องการชำระ');
                const amountInput = new TextInputBuilder().setCustomId('amount_input').setLabel('จำนวนเงิน (บาท)').setStyle(TextInputStyle.Short).setPlaceholder('กรอกตัวเลข เช่น 100').setRequired(true);
                modal.addComponents(new ActionRowBuilder().addComponents(amountInput));
                await interaction.showModal(modal);
            } 
            else if (selected === 'clear_selection') {
                const resetRow = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder().setCustomId('payment_method').setPlaceholder('กรุณาเลือกช่องทางการชำระเงิน').addOptions([
                        { label: 'PromptPay', description: 'ระบุจำนวนเงินเพื่อสร้าง QR Code พร้อมเพย์', value: 'promptpay_custom', emoji: '🪪' },
                        { label: 'ยกเลิก / ล้างตัวเลือก', description: 'รีเซ็ตเมนูเพื่อให้กดเลือกใหม่ได้', value: 'clear_selection', emoji: '❌' }
                    ])
                );
                await interaction.update({ components: [resetRow] });
            }
        }
        else if (interaction.customId === 'select_city_update') {
            const cityInfo = shopData[selected];
            const modal = new ModalBuilder().setCustomId(`modal_update_${selected}`).setTitle(`อัปเดต ${cityInfo.name}`);
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_price').setLabel('ราคาต่อ 1M').setStyle(TextInputStyle.Short).setValue(cityInfo.price.toString()).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_stock').setLabel('จำนวนพร้อมส่ง').setStyle(TextInputStyle.Short).setValue(cityInfo.stock.toString()).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_extra').setLabel('ข้อความเพิ่มเติม (ไม่บังคับ)').setStyle(TextInputStyle.Short).setValue(cityInfo.extra || '').setRequired(false))
            );
            await interaction.showModal(modal);
        }
    }

    else if (interaction.isModalSubmit()) {
        
        if (interaction.customId === 'promptpay_modal') {
            const amount = interaction.fields.getTextInputValue('amount_input');
            if (isNaN(amount) || Number(amount) <= 0) { return await interaction.reply({ content: '❌ กรุณากรอกจำนวนเงินเป็นตัวเลขที่ถูกต้องเท่านั้น', ephemeral: true }); }
            const qrUrl = `https://promptpay.io/${PROMPTPAY_NUMBER}/${amount}.png`;
            const attachment = new AttachmentBuilder(qrUrl, { name: 'qrcode.png' });
            const payEmbed = new EmbedBuilder().setTitle('📌 QR Code สำหรับชำระเงิน (PromptPay)').setDescription(`💰 ยอดที่ต้องชำระ: **${amount} บาท**\n\nเมื่อโอนเสร็จแล้ว ให้กดปุ่ม **"✅ โอนเงินแล้ว"** ด้านล่างด้วยนะคั้บ`).setImage('attachment://qrcode.png').setColor('#ffaa00');
            const buttonRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('paid_success').setLabel('โอนเงินแล้ว').setStyle(ButtonStyle.Success).setEmoji('✅'),
                new ButtonBuilder().setCustomId('reenter_amount').setLabel('กรอกยอดใหม่').setStyle(ButtonStyle.Primary).setEmoji('🔄'),
                new ButtonBuilder().setCustomId('cancel_payment').setLabel('ยกเลิก').setStyle(ButtonStyle.Danger).setEmoji('✖️')
            );
            if (interaction.isFromMessage()) { await interaction.update({ embeds: [payEmbed], files: [attachment], components: [buttonRow] }); } 
            else { await interaction.reply({ embeds: [payEmbed], files: [attachment], components: [buttonRow], ephemeral: true }); }
        }
        
        else if (interaction.customId === 'modal_addcity') {
            const name = interaction.fields.getTextInputValue('in_name');
            const price = interaction.fields.getTextInputValue('in_price');
            const stock = interaction.fields.getTextInputValue('in_stock');
            const extra = interaction.fields.getTextInputValue('in_extra') || '';
            const emoji = interaction.fields.getTextInputValue('in_emoji') || '📌'; 

            const key = name.toLowerCase().replace(/\s+/g, '_');
            shopData[key] = { name: name, price: price, stock: stock, extra: extra, emoji: emoji };
            saveShopData();

            await interaction.update({ 
                content: `✅ **เพิ่มเมืองใหม่เรียบร้อยแล้ว!**`, 
                embeds: [generateShopEmbed()], 
                components: [] 
            });
        }
        else if (interaction.customId.startsWith('modal_update_')) {
            const key = interaction.customId.replace('modal_update_', '');
            shopData[key].price = interaction.fields.getTextInputValue('in_price');
            shopData[key].stock = interaction.fields.getTextInputValue('in_stock');
            shopData[key].extra = interaction.fields.getTextInputValue('in_extra') || '';
            saveShopData();
            
            await interaction.update({ 
                content: `<@&${CUSTOMER_ROLE_ID}>`, 
                embeds: [generateShopEmbed()], 
                components: [] 
            });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);