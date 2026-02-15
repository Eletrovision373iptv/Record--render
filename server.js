const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// URL do seu arquivo M3U da Record no GitHub (você vai criar amanhã)
const M3U_URL = 'https://raw.githubusercontent.com/Eletrovision373iptv/minha-lista2/refs/heads/main/lista_record.m3u';

let canais = [];
let usuariosOnline = {};
let ultimaAtualizacao = null;

// Função para buscar e atualizar os canais do GitHub
async function atualizarCanaisDoGitHub() {
    try {
        console.log('🔄 Buscando canais do GitHub...');
        
        const response = await axios.get(M3U_URL, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });

        const m3uContent = response.data;
        const linhas = m3uContent.split('\n');
        
        const novosCanais = [];
        let nomeAtual = '';
        
        for (let i = 0; i < linhas.length; i++) {
            const linha = linhas[i].trim();
            
            // Linha #EXTINF com informações do canal
            if (linha.startsWith('#EXTINF')) {
                // Extrai o nome do canal (última parte depois da vírgula)
                const partes = linha.split(',');
                if (partes.length > 1) {
                    nomeAtual = partes[partes.length - 1].trim();
                }
            }
            // Linha com a URL do M3U8 ou marcador de aguardando
            else if ((linha.startsWith('http') || linha.startsWith('#AGUARDANDO')) && nomeAtual) {
                novosCanais.push({
                    nome: nomeAtual,
                    m3u8: linha.startsWith('#AGUARDANDO') ? '#' : linha
                });
                nomeAtual = '';
            }
        }

        if (novosCanais.length > 0) {
            canais = novosCanais;
            ultimaAtualizacao = new Date();
            console.log(`✅ ${canais.length} canais atualizados com sucesso!`);
            console.log(`📺 Canais: ${canais.map(c => c.nome).join(', ')}`);
        } else {
            console.log('⚠️ Nenhum canal encontrado no arquivo M3U');
        }

    } catch (error) {
        console.error('❌ Erro ao atualizar canais:', error.message);
        // Se der erro, usa canais de exemplo
        if (canais.length === 0) {
            canais = [
                { nome: 'Record SP', m3u8: '#' },
                { nome: 'Record Rio', m3u8: '#' },
                { nome: 'Record Minas', m3u8: '#' },
                { nome: 'Record RS', m3u8: '#' },
                { nome: 'Record Brasília', m3u8: '#' }
            ];
            console.log('⚠️ Usando canais de exemplo. Configure o arquivo M3U no GitHub.');
        }
    }
}

// Atualizar canais ao iniciar
atualizarCanaisDoGitHub();

// Atualizar automaticamente a cada 5 minutos
setInterval(atualizarCanaisDoGitHub, 5 * 60 * 1000);

// Página principal
app.get('/', (req, res) => {
    const host = req.headers.host;
    
    res.send(`
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UNIBOX - Record Plus</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            background: linear-gradient(135deg, #1a0033 0%, #330066 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            color: #fff;
            min-height: 100vh;
            padding-bottom: 60px;
        }

        .header {
            background: #000;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #d946ef;
            box-shadow: 0 2px 10px rgba(217, 70, 239, 0.3);
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 24px;
            font-weight: bold;
        }

        .logo-icon {
            width: 35px;
            height: 35px;
            background: #d946ef;
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }

        .logo-text { color: #fff; }
        .logo-text span {
            color: #d946ef;
            text-shadow: 0 0 10px rgba(217, 70, 239, 0.5);
        }

        .header-buttons {
            display: flex;
            gap: 10px;
        }

        .btn-m3u, .btn-atualizar {
            background: #d946ef;
            color: #fff;
            padding: 10px 20px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            font-size: 14px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(217, 70, 239, 0.3);
            border: none;
            cursor: pointer;
        }

        .btn-atualizar {
            background: #4ade80;
        }

        .btn-m3u:hover, .btn-atualizar:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(217, 70, 239, 0.5);
        }

        .info-bar {
            background: rgba(0, 0, 0, 0.5);
            padding: 10px 20px;
            text-align: center;
            color: #d946ef;
            font-size: 13px;
            border-bottom: 1px solid rgba(217, 70, 239, 0.2);
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }

        .card {
            background: rgba(0, 0, 0, 0.6);
            border: 2px solid #333;
            border-radius: 15px;
            padding: 20px;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #d946ef 0%, #c026d3 100%);
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .card:hover {
            transform: translateY(-5px);
            border-color: #d946ef;
            box-shadow: 0 10px 30px rgba(217, 70, 239, 0.3);
        }

        .card:hover::before { opacity: 1; }

        .card-logo {
            text-align: center;
            margin-bottom: 15px;
        }

        .card-logo img {
            width: 100px;
            height: auto;
            filter: drop-shadow(0 2px 5px rgba(217, 70, 239, 0.3));
        }

        .card-title {
            font-size: 18px;
            font-weight: bold;
            color: #d946ef;
            text-align: center;
            margin-bottom: 12px;
            text-shadow: 0 2px 5px rgba(217, 70, 239, 0.3);
        }

        .online-count {
            color: #4ade80;
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
        }

        .online-dot {
            width: 8px;
            height: 8px;
            background: #4ade80;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.1); }
        }

        .btn-assistir {
            width: 100%;
            background: linear-gradient(135deg, #d946ef 0%, #c026d3 100%);
            color: #fff;
            padding: 14px;
            border-radius: 10px;
            border: none;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            margin-bottom: 8px;
            transition: all 0.3s ease;
            text-decoration: none;
            display: block;
            text-align: center;
            box-shadow: 0 4px 15px rgba(217, 70, 239, 0.3);
        }

        .btn-assistir:hover {
            transform: scale(1.02);
            box-shadow: 0 6px 20px rgba(217, 70, 239, 0.5);
            background: linear-gradient(135deg, #c026d3 0%, #a21caf 100%);
        }

        .btn-copiar {
            width: 100%;
            background: rgba(255, 255, 255, 0.1);
            color: #d946ef;
            padding: 12px;
            border-radius: 10px;
            border: 1px solid rgba(217, 70, 239, 0.3);
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .btn-copiar:hover {
            background: rgba(217, 70, 239, 0.2);
            border-color: #d946ef;
        }

        .toast {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: #d946ef;
            color: #fff;
            padding: 15px 30px;
            border-radius: 10px;
            font-weight: bold;
            display: none;
            z-index: 1000;
            box-shadow: 0 5px 20px rgba(217, 70, 239, 0.4);
        }

        @media (max-width: 768px) {
            .grid { grid-template-columns: 1fr; }
            .header { flex-direction: column; gap: 10px; }
            .header-buttons { width: 100%; }
            .btn-m3u, .btn-atualizar { flex: 1; }
            .card-logo img { width: 80px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">
            <div class="logo-icon">📺</div>
            <div class="logo-text">UNIBOX <span>RECORD PLUS</span></div>
        </div>
        <div class="header-buttons">
            <button onclick="forcarAtualizacao()" class="btn-atualizar">🔄 ATUALIZAR</button>
            <a href="/baixar-m3u" class="btn-m3u">📥 M3U</a>
        </div>
    </div>

    <div class="info-bar">
        📡 ${canais.length} canais disponíveis • Última atualização: ${ultimaAtualizacao ? new Date(ultimaAtualizacao).toLocaleString('pt-BR') : 'Aguardando...'}
    </div>

    <div class="container">
        <div class="grid">
            ${canais.map((canal, index) => `
            <div class="card">
                <div class="card-logo">
                    <img src="https://upload.wikimedia.org/wikipedia/pt/1/10/Logotipo_da_Record.png" alt="Record Logo">
                </div>
                <div class="card-title">${canal.nome}</div>
                <div class="online-count">
                    <span class="online-dot"></span>
                    <span id="count-${index}">0 ON</span>
                </div>
                <a href="/stream/${index}" target="_blank" class="btn-assistir">▶️ ASSISTIR</a>
                <button onclick="copiarLink('http://${host}/stream/${index}')" class="btn-copiar">
                    📋 COPIAR LINK
                </button>
            </div>
            `).join('')}
        </div>
    </div>

    <div id="toast" class="toast">✓ Link copiado!</div>

    <script>
        function copiarLink(link) {
            const textArea = document.createElement('textarea');
            textArea.value = link;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                mostrarToast('✓ Link copiado com sucesso!');
            } catch (err) {
                alert('Erro ao copiar: ' + err);
            }
            
            document.body.removeChild(textArea);
        }

        async function forcarAtualizacao() {
            mostrarToast('🔄 Atualizando canais...');
            try {
                await fetch('/atualizar-canais');
                setTimeout(() => location.reload(), 2000);
            } catch (e) {
                mostrarToast('❌ Erro ao atualizar');
            }
        }

        function mostrarToast(msg) {
            const toast = document.getElementById('toast');
            toast.textContent = msg;
            toast.style.display = 'block';
            setTimeout(() => {
                toast.style.display = 'none';
            }, 2500);
        }

        setInterval(async () => {
            try {
                const response = await fetch('/stats');
                const stats = await response.json();
                
                Object.keys(stats).forEach(index => {
                    const elem = document.getElementById('count-' + index);
                    if (elem) {
                        elem.textContent = stats[index] + ' ON';
                    }
                });
            } catch (e) {}
        }, 3000);
    </script>
</body>
</html>
    `);
});

// Endpoint para forçar atualização manual
app.get('/atualizar-canais', async (req, res) => {
    await atualizarCanaisDoGitHub();
    res.json({ 
        success: true, 
        canais: canais.length,
        ultimaAtualizacao: ultimaAtualizacao
    });
});

// Stream endpoint
app.get('/stream/:index', (req, res) => {
    const index = parseInt(req.params.index);
    const canal = canais[index];
    
    if (!canal) {
        return res.status(404).send('Canal não encontrado');
    }

    if (canal.m3u8 === '#') {
        return res.status(503).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Canal em Configuração</title>
                <style>
                    body { font-family: Arial; text-align: center; padding: 50px; background: #1a0033; color: #d946ef; }
                    h1 { margin-bottom: 20px; }
                    button { background: #d946ef; color: #fff; padding: 15px 30px; border: none; border-radius: 10px; font-size: 16px; cursor: pointer; margin-top: 20px; font-weight: bold; }
                    button:hover { background: #c026d3; }
                </style>
            </head>
            <body>
                <h1>⚙️ Canal em Configuração</h1>
                <p>O link M3U8 para <strong>${canal.nome}</strong> ainda não foi configurado.</p>
                <p>Adicione os links no arquivo <strong>lista_record.m3u</strong> no GitHub.</p>
                <button onclick="history.back()">⬅️ Voltar</button>
            </body>
            </html>
        `);
    }

    usuariosOnline[index] = (usuariosOnline[index] || 0) + 1;

    setTimeout(() => {
        if (usuariosOnline[index] > 0) usuariosOnline[index]--;
    }, 5000);

    // Redireciona direto para o M3U8
    res.redirect(canal.m3u8);
});

// Stats
app.get('/stats', (req, res) => {
    res.json(usuariosOnline);
});

// Baixar M3U
app.get('/baixar-m3u', (req, res) => {
    const host = req.headers.host;
    let m3u = '#EXTM3U\n';
    
    canais.forEach((canal, index) => {
        m3u += `#EXTINF:-1 tvg-id="" tvg-name="${canal.nome}" tvg-logo="https://upload.wikimedia.org/wikipedia/pt/1/10/Logotipo_da_Record.png" group-title="Record TV",${canal.nome}\n`;
        m3u += `http://${host}/stream/${index}\n`;
    });

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename=record_tv.m3u');
    res.send(m3u);
});

app.listen(PORT, () => {
    console.log(`🚀 UNIBOX Record Plus rodando na porta ${PORT}`);
    console.log(`📺 ${canais.length} canais carregados`);
    console.log(`🔄 Atualização automática a cada 5 minutos`);
});
