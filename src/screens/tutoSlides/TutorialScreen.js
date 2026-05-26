import React from 'react';
import { StyleSheet, View, Text, ImageBackground, TouchableOpacity } from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import { BlurView } from 'expo-blur';
import i18next from '../../services/staticTL';

const tutorialImages = {
  slide1: require('../../../assets/tutorial/slide1.png'),
  slide2: require('../../../assets/tutorial/slide2.png'),
  slide3: require('../../../assets/tutorial/slide3.png'),
  slide4: require('../../../assets/tutorial/slide4.png'),
  slide5: require('../../../assets/tutorial/slide5.png'),
};

const TutorialButton = ({ label, ...props }) => (
  <TouchableOpacity style={styles.footerButton} activeOpacity={0.8} {...props}>
    <Text style={styles.footerButtonText}>{label}</Text>
  </TouchableOpacity>
);

const SlideCard = ({ title, subtitle, imageSource }) => (
  <View style={styles.page}>
    <ImageBackground source={imageSource} style={styles.pageImage} resizeMode="cover">
      <BlurView intensity={90} tint="dark" style={styles.textPanel}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </BlurView>
    </ImageBackground>
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
              title={i18next.t('tutorial.welcomeTitle')}
              subtitle={i18next.t('tutorial.welcomeSubtitle')}
              imageSource={tutorialImages.slide1}
            />
          ),
          title: '',
          subtitle: '',
        },
        {
          backgroundColor: '#121827',
          image: (
            <SlideCard
              title={i18next.t('tutorial.messagesTitle')}
              subtitle={i18next.t('tutorial.messagesSubtitle')}
              imageSource={tutorialImages.slide2}
            />
          ),
          title: '',
          subtitle: '',
        },
        {
          backgroundColor: '#1F2937',
          image: (
            <SlideCard
              title={i18next.t('tutorial.createTitle')}
              subtitle={i18next.t('tutorial.createSubtitle')}
              imageSource={tutorialImages.slide3}
            />
          ),
          title: '',
          subtitle: '',
        },
        {
          backgroundColor: '#111827',
          image: (
            <SlideCard
              title={i18next.t('tutorial.profileTitle')}
              subtitle={i18next.t('tutorial.profileSubtitle')}
              imageSource={tutorialImages.slide4}
            />
          ),
          title: '',
          subtitle: '',
        },
        {
          backgroundColor: '#0B0D14',
          image: (
            <SlideCard
              title={i18next.t('tutorial.readyTitle')}
              subtitle={i18next.t('tutorial.readySubtitle')}
              imageSource={tutorialImages.slide5}
            />
          ),
          title: '',
          subtitle: '',
        }
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0B0D14',
    flex: 1,
  },
  imageContainer: {
    paddingBottom: 0,
    flex: 1,
  },
  page: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  pageImage: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  textPanel: {
    width: '100%',
    borderRadius: 24,
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#CBD5E1',
    fontSize: 16,
    lineHeight: 22,
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
