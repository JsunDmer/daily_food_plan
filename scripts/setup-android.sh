#!/bin/bash
set -e

echo "========================================"
echo " Android 项目生成脚本"
echo "========================================"

# 1. 生成 Android 原生项目骨架
echo ""
echo "[1/6] npx cap add android ..."
npx cap add android

# 2. 覆盖核心 Gradle 配置
echo "[2/6] 覆盖 build.gradle ..."
CONFIG=config/android
ANDROID=android

cp "$CONFIG/build.gradle"           "$ANDROID/build.gradle"
cp "$CONFIG/variables.gradle"       "$ANDROID/variables.gradle"
cp "$CONFIG/app/build.gradle"       "$ANDROID/app/build.gradle"
cp "$CONFIG/app/proguard-rules.pro" "$ANDROID/app/proguard-rules.pro"

# 3. 覆盖 gradle-wrapper.properties
echo "[3/6] 覆盖 gradle-wrapper.properties ..."
cp "$CONFIG/gradle/wrapper/gradle-wrapper.properties" "$ANDROID/gradle/wrapper/gradle-wrapper.properties"

# 4. 生成应用图标 (SVG → PNG)
echo "[4/6] 生成应用图标 ..."

ICON_SVG="$CONFIG/icon.svg"
ICON_FG_SIZE=108  # foreground 基准尺寸 (108dp)
DENSITIES=( "mdpi:1" "hdpi:1.5" "xhdpi:2" "xxhdpi:3" "xxxhdpi:4" )
LEGACY_SIZES=( "mdpi:48" "hdpi:72" "xhdpi:96" "xxhdpi:144" "xxxhdpi:192" )

# 安装 rsvg-convert
sudo apt-get update -qq && sudo apt-get install -y -qq librsvg2-bin > /dev/null 2>&1

for entry in "${DENSITIES[@]}"; do
  dir="mipmap-${entry%%:*}"
  scale="${entry##*:}"
  fg_size=$(echo "$ICON_FG_SIZE * $scale" | bc | cut -d. -f1)

  rsvg-convert "$ICON_SVG" -w "$fg_size" -h "$fg_size" \
    -o "$ANDROID/app/src/main/res/$dir/ic_launcher_foreground.png"
done

# 生成 legacy 图标 (单色背景 + 前景合成)
echo "[5/6] 生成 legacy 图标 (ic_launcher.png) ..."
ORANGE="#E85D04"
sudo apt-get install -y -qq imagemagick > /dev/null 2>&1

for entry in "${LEGACY_SIZES[@]}"; do
  dir="mipmap-${entry%%:*}"
  size="${entry##*:}"
  fg_size=$(echo "$size * 2.25" | bc | cut -d. -f1)

  fg_png=$(mktemp)
  rsvg-convert "$ICON_SVG" -w "$fg_size" -h "$fg_size" -o "$fg_png"
  magick convert -size "${size}x${size}" "xc:$ORANGE" \
    "$fg_png" -gravity center -composite \
    "$ANDROID/app/src/main/res/$dir/ic_launcher.png"
  cp "$ANDROID/app/src/main/res/$dir/ic_launcher.png" \
     "$ANDROID/app/src/main/res/$dir/ic_launcher_round.png"
  rm "$fg_png"
done

# 5. 更新背景色
echo "[5/6] 更新 ic_launcher_background.xml ..."
mkdir -p "$ANDROID/app/src/main/res/values"
cat > "$ANDROID/app/src/main/res/values/ic_launcher_background.xml" << 'XML'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#E85D04</color>
</resources>
XML

# 6. 同步 Web 资源
echo "[6/6] npx cap sync ..."
npx cap sync

echo ""
echo "========================================"
echo " Android 项目准备完成"
echo "========================================"
