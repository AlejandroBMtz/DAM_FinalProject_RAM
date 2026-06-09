import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import i18next from '../../services/staticTL';

export default function PrivacyPolicyScreen({ navigation }) {
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
                        RAM recopila información básica de tu perfil institucional con el único fin de validar tu identidad académica. Esto incluye tu nombre completo, dirección de correo electrónico electrónico institucional (@alumnos.uaq.mx), carrera, facultad y el semestre en curso. Asimismo, la aplicación almacena, procesa y despliega las imágenes, fotografías o capturas de pantalla que decidas subir voluntariamente a través del servicio de terceros Cloudinary, tales como fotos de perfil o archivos adjuntos en los tickets de soporte y reportes.
                    </Text>

                    <Text style={styles.sectionTitle}>2. Uso y Finalidad de los Datos</Text>
                    <Text style={styles.text}>
                        Tus datos personales se utilizan exclusivamente para operar la plataforma y facilitar de manera segura la conexión, comunicación y el apoyo académico mutuo entre los estudiantes de la comunidad universitaria. RAM no vende, alquila, comercializa ni comparte tu información personal con terceras partes ajenas al ecosistema operativo de la aplicación o a las autoridades de la UAQ que así lo requieran por motivos de fuerza mayor.
                    </Text>

                    <Text style={styles.sectionTitle}>3. Limitación de Responsabilidad en la Seguridad de los Datos</Text>
                    <Text style={styles.text}>
                        Para la autenticación, gestión y almacenamiento de la base de datos, RAM utiliza la infraestructura del servicio externo Firebase (Google). Si bien se emplean los estándares de encriptación de dicha plataforma para proteger tus credenciales de acceso (por lo que ningún administrador del sistema tiene visibilidad de tu contraseña), el usuario reconoce que las medidas de seguridad en internet no son inquebrantables.
                    </Text>
                    <Text style={[styles.text, { marginTop: 8 }]}>
                        RAM, sus desarrolladores y colaboradores no garantizan la seguridad absoluta de la información ante posibles vulnerabilidades técnicas, hackeos, accesos no autorizados o filtraciones de datos ajenas a nuestro control directo. Al utilizar la aplicación, aceptas que la transmisión de tus datos corre bajo tu propio riesgo y eximes a los creadores de la plataforma de cualquier responsabilidad legal o civil derivada de incidentes de seguridad cibernética o pérdida de datos.
                    </Text>

                    <Text style={styles.sectionTitle}>4. Retención y Eliminación de Información</Text>
                    <Text style={styles.text}>
                        Los datos se conservarán en el sistema mientras mantengas tu cuenta activa dentro de la plataforma. Como titular de la información, puedes editar tus datos en cualquier momento desde la sección de "Editar Perfil". En caso de que desees revocar tu consentimiento, dar de baja tu cuenta y eliminar de manera permanente todo tu historial asociado (incluyendo tickets, mensajes internos, solicitudes de apoyo y datos de perfil), deberás enviar una solicitud formal a través del módulo de soporte técnico de la app.
                    </Text>

                    <Text style={styles.sectionTitle}>5. Modificaciones a la Política de Privacidad</Text>
                    <Text style={styles.text}>
                        Nos reservamos el derecho de actualizar, modificar o alterar esta Política de Privacidad en cualquier momento para adaptarla a nuevas funciones de la aplicación o requerimientos legales. El uso continuado de RAM posterior a la publicación de cualquier cambio constituye la aceptación expresa de las nuevas políticas estasblecidas.
                    </Text>

                    <View style={styles.divider} />

                    <Text style={styles.footerNote}>
                        Al usar RAM, confirmas que eres un estudiante activo, que has leído este documento y que aceptas el manejo, limitaciones de responsabilidad y tratamiento de datos descrito anteriormente.
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
        marginTop: 0,
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