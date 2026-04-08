
import Feature from '../components/LandingComponents/Feature.jsx'
import Footer from '../components/LandingComponents/Footer.jsx'
import Hero from '../components/LandingComponents/Hero.jsx'
import HowItWorks from '../components/LandingComponents/HowItWorks.jsx'
import KanbanPreview from '../components/LandingComponents/KanbanPreview.jsx'
import Navbar from '../components/LandingComponents/Navbar.jsx'
import ProgressTracking from '../components/LandingComponents/ProgressTracking.jsx'
import Stats from '../components/LandingComponents/Stats.jsx'
import TeamCollaboration from '../components/LandingComponents/TeamCollaboration.jsx'
import Testimonials from '../components/LandingComponents/Testimonials.jsx'

const LandingPage = () => {
  return (
    <div className="relative overflow-x-clip">
        <Navbar />
        <Hero />
        <Stats />
        <Feature />
        <HowItWorks />
        <KanbanPreview />
        <TeamCollaboration />
        <ProgressTracking />
        <Testimonials />
        <Footer />
    </div>
  )
}

export default LandingPage