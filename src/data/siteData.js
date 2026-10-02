import heroSlideOne from '../assets/home/2.jpg'
import heroSlideTwo from '../assets/home/3.jpg'
import heroSlideThree from '../assets/home/4.jpg'
import clientAvatarOne from '../assets/home/avtar3.png'
import clientAvatarTwo from '../assets/home/ava1.jpg'
import clientAvatarThree from '../assets/home/ava2.jpg'
import brandLogo from '../assets/home/Rahmat.com_45.jpg'
import galleryImg1 from '../assets/gallery/WhatsApp-Image-2023-01-31-at-13.26.03-2.jpeg'
import galleryImg2 from '../assets/gallery/WhatsApp-Image-2023-01-31-at-13.26.03-1.jpeg'
import galleryImg3 from '../assets/gallery/WhatsApp-Image-2023-01-31-at-13.26.02.jpeg'
import galleryImg4 from '../assets/gallery/Rahmat.com_46.jpg'
import galleryImg5 from '../assets/gallery/Rahmat.com_43_2-e1675152948617.jpg'
import galleryImg6 from '../assets/gallery/Rahmat.com_38_2.jpg'
import galleryImg7 from '../assets/gallery/Rahmat.com_30_3.jpg'
import galleryImg8 from '../assets/gallery/Rahmat.com_27_3.jpg'

export const brand = {
    name: 'RAHMAT ADVOCATE',
    tagline: 'JUSTICE FOR ALL',
    logo: brandLogo,
}

export const navigation = [
    {label: 'Home', path: '/'},
    {label: 'Services', path: '/services'},
    {label: 'Contact Us', path: '/contact-us'},
    {label: 'About Us', path: '/about-us'},
    {label: 'Our Blog', path: '/our-blog'},
    {label: 'Gallery', path: '/gallery'},
    {label: 'Post Blog', path: '/post-blog'},
]

export const socials = [
    {label: 'Facebook', href: 'https://www.facebook.com/rahmat.lawyer.9'},
    {label: 'Twitter', href: 'https://twitter.com/RAHMATLAWYER?s=08'},
    {label: 'Instagram', href: 'https://www.instagram.com/p/ByMPBXWHHT9/?igshid=v3edq71bx68c'},
    {label: 'LinkedIn', href: 'https://www.linkedin.com/in/rahmat-lawyer-165816147'},
]

export const heroSlides = [
    {
        title: 'MR. RAHMAT ADVOCATES  & ASSOCIATES',
        caption:
            'Law firms may be comprised of a single attorney, of several lawyers, or of many attorneys, organized as partners.',
        image: heroSlideOne,
        align: 'center',
        contentClass: 'mx-auto max-w-[640px]',
        actionsClass: 'justify-center',
        backgroundPosition: 'center',
    },
    {
        title: 'BUSINESS LEGAL PRACTICE',
        caption:
            'Formation and incorporation of a business, contracts, employment law, intellectual property, mergers and acquisitions, and tax law.',
        image: heroSlideTwo,
        align: 'left',
        containerClass: 'justify-start text-left',
        contentClass: 'mr-auto max-w-[640px] lg:pl-6',
        actionsClass: 'justify-start',
        backgroundPosition: 'center',
    },
    {
        title: 'PERSONAL FREE CONSULTING',
        caption:
            'Personal free consulting is usually offered voluntarily and without expectation of compensation, and may be done informally among friends, family, or community members, or more formally through an organization or service.',
        image: heroSlideThree,
        align: 'right',
        containerClass: 'justify-end text-right',
        contentClass: 'ml-auto max-w-[650px] lg:pr-6',
        actionsClass: 'justify-end',
        backgroundPosition: 'center',
    },
]

export const practiceItems = [
    {
        title: 'Corporate & Securities',
        body: 'Corporate and securities law refers to the legal framework that governs the formation, operation, and regulation of corporations and securities. It includes the laws, regulations, and rules related to the issuance and sale of securities, such as stocks, bonds, and other financial instruments.',
    },
    {
        title: 'Real Estate Law',
        body: 'Real estate law is a branch of law that deals with the rights and interests in real property. Real property refers to land and any structures attached to it, including buildings, homes, and other improvements.',
    },
    {
        title: 'Criminal Law',
        body: 'Criminal law is a branch of law that defines and regulates criminal offenses and their penalties. It is a system of laws and regulations designed to prevent and punish behavior that is harmful to individuals, society, or the state.',
    },
]
export const MoreAboutLayer = [
    {
        title: '#1 Law Firm 2019',
        body: 'Rankings of law firms can vary based on different criteria, such as size, practice areas, geographic location, and financial performance.'
    },
    {
        title: 'Professional Lawyers',
        body: 'The members of a professional lawyers team typically have specialized knowledge and experience in specific areas of law, such as corporate law, real estate law, criminal law, and so on. They work together to provide clients with a full range of legal services, including advice and representation in legal matters, negotiations, and litigation.'
    },
    {
        title: 'GLOBALLY NRI’s',
        body: 'Globally NRI’s legal Matters in India, Local to Global NRI all Issues related to Court & Police, Family, Divorce &amp; Property Laws, Complaint at Consulate, Home Office, Embassy, Home Affairs, LOC - (Look Out Circular), NBW - Non-bailable Warrant) Arrest in Pending Cases, Anticipatory Bail, Arrested at Airports & Customs, Contesting & Challenging for Foreign Divorce & Ex-parte Divorce, Dissolution of Marriage, Spousal & Child Support and Maintenance, Child Custody & Visitation Rights, other Legal Problems, CONJUGAL RIGHTS or Divorce Notice &amp; Reply to Legal Notices.'
    }
]


export const counters = [
    {label: 'Happy Clients', value: 935, suffix: '+'},
    {label: 'Successful Rates', value: 96, suffix: '%'},
    {label: 'Domestic Locations', value: 78, suffix: '+'},
    {label: 'Cases Closed', value: 5062, suffix: '+'},
]

export const testimonials = [
    {
        quote:
            'Advocate Rahmat having a Versatile Rich Experience and very Professional Advocate in Mehdipatnam, Hyderabad,\n' +
            'MRS KAUSAR *Muslim Hijaabi Women Advocate spl in International &amp; Muslim Law.\n' +
            'There best Legal services for Local to Globally NRI\'s in Cyber Crime, Divorce, Corporate law, Family Law &amp; Property Laws.',
        name: 'ISHRAD AYAN',
        avatar: clientAvatarOne,
    },
    {
        quote:
            'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae.',
        name: 'CHANDLER BING',
        avatar: clientAvatarTwo,
    },
    {
        quote:
            'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae.',
        name: 'PHOEBE BUFFAY',
        avatar: clientAvatarThree,
    },
]

export const galleryImages = [
    galleryImg1,
    galleryImg2,
    galleryImg3,
    galleryImg4,
    galleryImg5,
    galleryImg6,
    galleryImg7,
    galleryImg8,
]

