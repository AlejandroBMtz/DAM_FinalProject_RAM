import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import i18next from '../../services/staticTL';

export default function TermsScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header Moderno */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.title}>{i18next.t("settings.legal.terminos")}</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.card}>
                    <Text style={styles.lastUpdate}>Última actualización: 12 de Mayo, 2026</Text>

                    <Text style={styles.sectionTitle}>1. Aceptación de términos</Text>
                    <Text style={styles.text}>
                        Al utilizar StudentBank, aceptas cumplir con nuestras normas de comunidad. Esta plataforma está diseñada exclusivamente para el apoyo académico entre estudiantes de la UAQ...
                    </Text>

                    <Text style={styles.sectionTitle}>2. Uso del Servicio</Text>
                    <Text style={styles.text}>
                        Los usuarios se comprometen a no solicitar remuneración económica externa. El sistema de puntos es la única moneda válida dentro de la aplicación...
                    </Text>

                    <View style={styles.divider} />

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B0D14'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Platform.OS === 'ios' ? 0 : 40,
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#1F2229'
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#161920',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    title: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700'
    },
    scrollContent: {
        padding: 20
    },
    card: {
        backgroundColor: '#161920',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#1F2229'
    },
    lastUpdate: {
        color: '#6366F1',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 20,
        textTransform: 'uppercase'
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 20
    },
    text: {
        color: '#9CA3AF',
        fontSize: 14,
        lineHeight: 22,
        textAlign: 'justify'
    },
    divider: {
        height: 1,
        backgroundColor: '#1F2229',
        marginVertical: 25
    },
    footerNote: {
        color: '#4B5563',
        fontSize: 12,
        textAlign: 'center',
        fontStyle: 'italic'
    }
});