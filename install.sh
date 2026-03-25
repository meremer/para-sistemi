#!/bin/bash

echo "🚀 Kütüphane Yönetim Sistemi - Kurulum Başlatılıyor..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js bulunamadı!"
    echo "Lütfen Node.js'i şu adresten indirin: https://nodejs.org/tr/"
    exit 1
fi

echo "✅ Node.js bulundu: $(node --version)"
echo "✅ npm bulundu: $(npm --version)"
echo ""

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json bulunamadı!"
    echo "Lütfen stitch klasöründe olduğunuzdan emin olun."
    exit 1
fi

echo "📦 Bağımlılıklar yükleniyor..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install başarısız oldu!"
    exit 1
fi

echo ""
echo "✅ Kurulum tamamlandı!"
echo ""
echo "📊 Sunucuyu başlatmak için:"
echo "   npm start"
echo ""
echo "🔄 Development modunda başlatmak için:"
echo "   npm run dev"
echo ""
echo "📍 http://localhost:3000"
echo ""
echo "📚 Demo Hesapları:"
echo "   Admin: admin / 1234"
echo "   User: user1 / 1234"
