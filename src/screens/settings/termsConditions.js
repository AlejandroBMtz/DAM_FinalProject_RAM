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

                    <Text style={styles.sectionTitle}>1. Aceptación de los Términos</Text>
                    <Text style={styles.text}>
                        Al descargar, instalar, registrarte o utilizar la aplicación RAM, aceptas expresamente cumplir y estar sujeto a los presentes Términos y Condiciones de Uso, así como a todas las leyes y regulaciones aplicables. Si no estás de acuerdo con alguno de estos términos, debes abstenerte inmediatamente de usar e interactuar con este servicio.
                    </Text>

                    <Text style={styles.sectionTitle}>2. Elegibilidad y Uso de la Plataforma</Text>
                    <Text style={styles.text}>
                        Esta plataforma está diseñada y restringida exclusivamente para el uso de la comunidad estudiantil activa de la Universidad Autónoma de Querétaro (UAQ). El registro requiere obligatoriamente una cuenta de correo institucional válida. El usuario se compromete a proporcionar información verídica y a mantener la confidencialidad de sus datos de acceso. RAM se reserva el derecho de suspender o eliminar cualquier cuenta que se sospeche falsa o que pertenezca a un individuo ajeno a la institución.
                    </Text>

                    <Text style={styles.sectionTitle}>3. Prohibición de Transacciones Monetarias Externas</Text>
                    <Text style={styles.text}>
                        RAM es un entorno sin fines de lucro enfocado puramente en el apoyo académico. Los usuarios se comprometen de forma estricta a no solicitar, ofrecer, ni exigir remuneraciones económicas reales, transferencias monetarias o pagos externos de cualquier índole por las asesorías o la ayuda brindada. El sistema interno de puntos de la aplicación es la única "moneda" válida, simbólica y legítima para realizar interacciones o intercambios de asesorías dentro del ecosistema de la app.
                    </Text>

                    <Text style={styles.sectionTitle}>4. Exclusión Absoluta de Responsabilidad (Deslinde Legal)</Text>
                    <Text style={styles.text}>
                        RAM funciona como un mero canal de intermediación técnica entre estudiantes y no asume ninguna responsabilidad respecto a las interacciones humanas derivadas del uso del software.
                    </Text>
                    <Text style={[styles.text, { marginTop: 8 }]}>
                        • Contenido y Calidad Académica: No somos responsables de la veracidad, exactitud, calidad o utilidad del material de estudio, explicaciones o asesorías brindadas por los usuarios. El éxito o fracaso escolar derivado de la ayuda recibida es entera responsabilidad del estudiante.
                    </Text>
                    <Text style={[styles.text, { marginTop: 8 }]}>
                        • Conducta e Interacciones: No nos hacemos responsables bajo ninguna circunstancia de la conducta, mensajes, comportamiento o acciones de los usuarios, ya sea dentro de la aplicación o en encuentros físicos y presenciales fuera de ella. Cualquier agresión, fraude, acoso o actividad ilícita deberá ser reportada a las autoridades universitarias y legales competentes, eximiendo por completo a los desarrolladores de RAM de cualquier litigio.
                    </Text>
                    <Text style={[styles.text, { marginTop: 8 }]}>
                        • Fallas del Sistema: La aplicación se proporciona "tal cual" ("as is"). No garantizamos que el servicio funcione de manera ininterrumpida, libre de errores informáticos, bugs o caídas del servidor de Firebase, ni nos responsabilizamos por pérdidas de datos, puntos internos o progreso dentro de la app por fallas técnicas.
                    </Text>

                    <Text style={styles.sectionTitle}>5. Propiedad Intelectual y Normas Comunitarias</Text>
                    <Text style={styles.text}>
                        Queda terminantemente prohibido publicar material ofensivo, difamatorio, con derechos de autor de terceros sin autorización, o contenido inapropiado que viole la legislación vigente o el reglamento interno de la UAQ. Los administradores de RAM se reservan la facultad absoluta de moderar contenidos, penalizar conductas indebidas y cancelar de forma definitiva el acceso a usuarios que infrinjan los valores comunitarios de respeto mutuo y honestidad académica.
                    </Text>

                    <View style={styles.divider} />

                    <Text style={styles.footerNote}>
                        El uso inadecuado de RAM o el incumplimiento de estos términos podrá resultar en la baja inmediata de la cuenta y, de ser necesario, en el reporte correspondiente ante las autoridades universitarias de la UAQ.
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