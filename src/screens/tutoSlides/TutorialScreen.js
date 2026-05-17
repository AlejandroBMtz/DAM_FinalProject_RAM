import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import i18next from '../../services/staticTL';

const TutorialButton = ({ label, ...props }) => (
  <TouchableOpacity style={styles.footerButton} activeOpacity={0.8} {...props}>
    <Text style={styles.footerButtonText}>{label}</Text>
  </TouchableOpacity>
);

const SlideCard = ({ iconName, title, subtitle, imageSource }) => (
  <View style={styles.page}>
    <View style={styles.visualSection}>
      <View style={styles.glowCircle} />
      {imageSource ? (
        <Image source={imageSource} style={styles.pageImage} resizeMode="contain" />
      ) : (
        <View style={styles.iconWrapper}>
          <Ionicons name={iconName} size={72} color="#fff" />
        </View>
      )}
    </View>

    <BlurView intensity={80} tint="dark" style={styles.textPanel}>
      {/* LAS IMAGENES DEBERAN IR EN "assets/tutorial" */}
      {/* imageSource={require('../../../assets/tutorial/slide1.png')} */}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </BlurView>
  </View>
);

export default function TutorialScreen({ onDone }) {
  return (
    <Onboarding
      onSkip={onDone}
      onDone={onDone}
      bottomBarHighlight={false}
      SkipButtonComponent={(props) => <TutorialButton {...props} label={i18next.t('tutorial.skip')} />}
      NextButtonComponent={(props) => <TutorialButton {...props} label={i18next.t('tutorial.next')} />}
      DoneButtonComponent={(props) => <TutorialButton {...props} label={i18next.t('tutorial.done')} />}
      pageBackgroundColor="#0B0D14"
      imageContainerStyles={styles.imageContainer}
      containerStyles={styles.container}
      pages={[
        {
          backgroundColor: '#0B0D14',
          image: (
            <SlideCard
              iconName="rocket-outline"
              title={i18next.t('tutorial.welcomeTitle')}
              subtitle={i18next.t('tutorial.welcomeSubtitle')}
            />
          ),
          title: '',
          subtitle: '',
        },
        {
          backgroundColor: '#121827',
          image: (
            <SlideCard
              iconName="chatbubble-ellipses-outline"
              title={i18next.t('tutorial.messagesTitle')}
              subtitle={i18next.t('tutorial.messagesSubtitle')}
            />
          ),
          title: '',
          subtitle: '',
        },
        {
          backgroundColor: '#1F2937',
          image: (
            <SlideCard
              iconName="document-text-outline"
              title={i18next.t('tutorial.createTitle')}
              subtitle={i18next.t('tutorial.createSubtitle')}
            />
          ),
          title: '',
          subtitle: '',
        },
        {
          backgroundColor: '#111827',
          image: (
            <SlideCard
              iconName="person-circle-outline"
              title={i18next.t('tutorial.profileTitle')}
              subtitle={i18next.t('tutorial.profileSubtitle')}
            />
          ),
          title: '',
          subtitle: '',
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0B0D14',
  },
  imageContainer: {
    paddingBottom: 0,
  },
  page: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  visualSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowCircle: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#4F46E5',
    opacity: 0.14,
    top: '20%',
  },
  iconWrapper: {
    width: 150,
    height: 150,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  pageImage: {
    width: '75%',
    height: '75%',
    borderRadius: 24,
  },
  textPanel: {
    width: '100%',
    borderRadius: 24,
    padding: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: '#CBD5E1',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  footerButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: '#4F46E5',
    marginHorizontal: 8,
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
