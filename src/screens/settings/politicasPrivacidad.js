import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import i18next from '../../services/staticTL';

export default function PrivacyScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header consistente con el resto de la app */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.title}>{i18next.t("settings.legal.politicas")}</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.card}>
                    <Text style={styles.lastUpdate}>Última actualización: 12 de Mayo, 2026</Text>

                    <Text style={styles.sectionTitle}>1. Información que recopilamos</Text>
                    <Text style={styles.text}>
                        StudentBank recopila información básica de tu perfil institucional, incluyendo tu nombre, correo (@alumnos.uaq.mx), carrera y semestre. También almacenamos las imágenes que decidas subir a Cloudinary para tu perfil o tickets.
                    </Text>

                    <Text style={styles.sectionTitle}>2. Uso de los datos</Text>
                    <Text style={styles.text}>
                        Tus datos se utilizan exclusivamente para facilitar la conexión entre estudiantes que necesitan ayuda académica. No compartimos tu información personal con terceros fuera del ecosistema de la UAQ.
                    </Text>

                    <Text style={styles.sectionTitle}>3. Seguridad</Text>
                    <Text style={styles.text}>
                        Utilizamos Firebase para la autenticación y almacenamiento seguro de tus datos. Tu contraseña está encriptada y nadie, ni siquiera los administradores de la app, tiene acceso a ella.
                    </Text>

                    <Text style={styles.sectionTitle}>4. Tus Derechos</Text>
                    <Text style={styles.text}>
                        Puedes editar tu información en cualquier momento desde la sección "Editar Perfil". Si deseas eliminar tu cuenta y todos tus datos asociados (tickets, mensajes y perfil), puedes solicitarlo a través del soporte técnico.
                    </Text>

                    <View style={styles.divider} />

                    <Text style={styles.footerNote}>
                        Al usar StudentBank, confirmas que eres un estudiante activo y aceptas el manejo de datos descrito anteriormente.
                    </Text>
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
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#1F2229',
        marginTop: Platform.OS === 'ios' ? 0 : 40,
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
        marginTop: 15
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