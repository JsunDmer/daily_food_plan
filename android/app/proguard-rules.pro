# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ===== ProGuard/R8 通用规则 =====
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes InnerClasses
-keepattributes Exceptions

# ===== Capacitor WebView 支持 =====
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.BridgeActivity { *; }
-keep class com.getcapacitor.Bridge { *; }
-keep class com.getcapacitor.Plugin { *; }
-keep class com.getcapacitor.annotation.** { *; }

# ===== JavaScript Bridge 接口 =====
-keepclassmembers class * {
    @com.getcapacitor.annotation.CapacitorPlugin <methods>;
    @com.getcapacitor.annotation.PluginMethod <methods>;
}

# ===== 序列化 Model =====
-keep class com.example.dailyfoodplan.model.** { *; }
-keep class com.example.dailyfoodplan.data.entity.** { *; }

# ===== 枚举 =====
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# ===== 调试栈跟踪 =====
#-keepattributes SourceFile,LineNumberTable
#-renamesourcefileattribute SourceFile