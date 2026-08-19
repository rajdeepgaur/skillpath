import {
    useState,
    useEffect,
    useMemo,
    useCallback,
    startTransition,
    type CSSProperties,
} from "react"

type CountryResponse = {
    country_code: "US" | "IN"
}

type Course = {
    mangoId: string
    courseName: string
    description: string
    mainCategory: string
    priceUsdCents: number
    pricePaise: number
}

interface MyComponentProps {
    sectionTitle: string
    cardRadius: number
    cardGap: number
}

const COUNTRY_API_URL =
    "https://syncsphere-hiv6.onrender.com/assignment/country-code"
const COURSE_API_URL =
    "https://syncsphere-hiv6.onrender.com/assignment/course-data"

function formatCoursePrice(
    course: Course,
    countryCode: CountryResponse["country_code"]
) {
    if (countryCode === "US") {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(course.priceUsdCents / 100)
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
    }).format(course.pricePaise / 100)
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function CourseSection(props: MyComponentProps) {
    const {
        sectionTitle,
        cardRadius,
        cardGap,
    } = props

    const [courses, setCourses] = useState<Course[]>([])
    const [countryCode, setCountryCode] = useState<
        CountryResponse["country_code"] | null
    >(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [retryCount, setRetryCount] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        let isMounted = true

        async function fetchWithRetry<T>(
            url: string,
            retries = 3,
            delay = 500
        ): Promise<T> {
            let lastError: unknown = null

            for (let i = 0; i < retries; i++) {
                try {
                    const response = await fetch(url)
                    if (!response.ok) {
                        throw new Error(
                            `HTTP error! status: ${response.status}`
                        )
                    }
                    return await response.json()
                } catch (fetchError) {
                    lastError = fetchError
                    if (i < retries - 1) {
                        await new Promise((resolve) =>
                            setTimeout(resolve, delay)
                        )
                    }
                }
            }

            throw lastError instanceof Error
                ? lastError
                : new Error("Unknown network error")
        }

        async function getCoursesDetails() {
            try {
                startTransition(() => {
                    setIsLoading(true)
                    setError(null)
                })

                const [countryData, courseData] = await Promise.all([
                    fetchWithRetry<CountryResponse>(COUNTRY_API_URL),
                    fetchWithRetry<Course[]>(COURSE_API_URL),
                ])

                if (!isMounted) {
                    return
                }

                startTransition(() => {
                    setCountryCode(countryData.country_code)
                    setCourses(courseData)
                })
            } catch {
                if (!isMounted) {
                    return
                }

                startTransition(() => {
                    setError(
                        "Could not load courses right now. Please try again in a moment."
                    )
                })
            } finally {
                if (isMounted) {
                    startTransition(() => {
                        setIsLoading(false)
                    })
                }
            }
        }

        getCoursesDetails()

        return () => {
            isMounted = false
        }
    }, [retryCount])

    const sectionStyle = useMemo<CSSProperties>(
        () => ({
            position: "relative",
            width: "100%",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            color: "#E9EAF1",
            fontFamily:
                'Inter, "Inter var", "SF Pro Text", "Segoe UI", system-ui, -apple-system, sans-serif',
            backgroundColor: "transparent",
        }),
        []
    )

    const gridStyle = useMemo<CSSProperties>(
        () => ({
            display: "grid",
            gap: cardGap,
            alignItems: "stretch",
        }),
        [cardGap]
    )

    const filteredCourses = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()

        if (!query) {
            return courses
        }

        return courses.filter((course) => {
            return (
                course.courseName.toLowerCase().includes(query) ||
                course.description.toLowerCase().includes(query) ||
                course.mainCategory.toLowerCase().includes(query)
            )
        })
    }, [courses, searchQuery])

    const renderCourseCard = useCallback(
        (course: Course) => (
            <article
                key={course.mangoId}
                style={{
                    boxSizing: "border-box",
                    padding: 18,
                    border: "1px solid rgba(255,255,255,0.12)",
                    backgroundColor: "#1A1A20",
                    borderRadius: cardRadius,
                    minHeight: 188,
                }}
            >
                <h2
                    style={{
                        margin: "0 0 10px",
                        color: "#F5F6FA",
                        fontSize: 19,
                        lineHeight: 1.25,
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                    }}
                >
                    {course.courseName}
                </h2>
                <p
                    style={{
                        margin: "0 0 14px",
                        color: "#A8ACB8",
                        fontSize: 14,
                        lineHeight: 1.5,
                    }}
                >
                    {course.description}
                </p>
                <p
                    style={{
                        margin: "0 0 8px",
                        color: "#ECEEF6",
                        fontSize: 17,
                        fontWeight: 600,
                    }}
                >
                    {countryCode ? formatCoursePrice(course, countryCode) : ""}
                </p>
                <p
                    style={{
                        margin: 0,
                        fontSize: 12,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#8F94A3",
                    }}
                >
                    {course.mainCategory}
                </p>
            </article>
        ),
        [cardRadius, countryCode]
    )

    const handleRetry = useCallback(() => {
        startTransition(() => {
            setRetryCount((value) => value + 1)
        })
    }, [])

    return (
        <section data-course-section style={sectionStyle}>
            <style>{`
                .framer-course-grid {
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                }

                @media (max-width: 810px) {
                    .framer-course-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                }

                @media (max-width: 480px) {
                    .framer-course-grid {
                        grid-template-columns: repeat(1, minmax(0, 1fr));
                    }
                }
            `}</style>
            <h1
                style={{
                    margin: 0,
                    fontSize: 34,
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                    color: "#F4F5FB",
                    fontWeight: 600,
                }}
            >
                {sectionTitle}
            </h1>

            {!isLoading && !error && (
                <input
                    type="search"
                    placeholder="Search courses"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    style={{
                        width: "100%",
                        boxSizing: "border-box",
                        border: "1px solid rgba(255,255,255,0.16)",
                        backgroundColor: "#1A1A20",
                        color: "#ECEEF6",
                        borderRadius: 10,
                        padding: "10px 12px",
                        fontSize: 14,
                        lineHeight: 1.4,
                        outline: "none",
                    }}
                />
            )}

            {isLoading && (
                <div
                    role="status"
                    aria-live="polite"
                    aria-label="Loading courses"
                    style={{
                        minHeight: 150,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                        color: "#F1F2F8",
                    }}
                >
                    <div
                        aria-hidden
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 999,
                            border: "4px solid rgba(255,255,255,0.16)",
                            borderTopColor: "#F5F6FA",
                            background:
                                "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.03) 100%)",
                        }}
                    />
                    <p style={{ margin: 0, color: "#E9ECF5" }}>
                        Loading courses...
                    </p>
                </div>
            )}

            {!isLoading && error && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 10,
                    }}
                >
                    <p style={{ margin: 0, color: "#FFB4AB", fontWeight: 600 }}>
                        {error}
                    </p>
                    <button
                        type="button"
                        onClick={handleRetry}
                        style={{
                            border: "1px solid rgba(255,255,255,0.16)",
                            backgroundColor: "#1A1A20",
                            color: "#ECEEF6",
                            borderRadius: 8,
                            padding: "8px 12px",
                            fontSize: 13,
                            lineHeight: 1,
                            cursor: "pointer",
                        }}
                    >
                        Try again
                    </button>
                </div>
            )}

            {!isLoading && !error && countryCode && (
                <div className="framer-course-grid" style={gridStyle}>
                    {filteredCourses.map(renderCourseCard)}
                </div>
            )}
        </section>
    )
}


// Uncomnment the following code to enable Framer property controls for the component when using on Framer.

// import { addPropertyControls, ControlType } from "framer"

// addPropertyControls(CourseSection, {
//     sectionTitle: {
//         type: ControlType.String,
//         title: "Section Title",
//         defaultValue: "Available Courses",
//     },
//     cardRadius: {
//         type: ControlType.Number,
//         title: "Card Radius",
//         min: 0,
//         max: 40,
//         step: 1,
//         defaultValue: 14,
//         unit: "px",
//         displayStepper: false,
//     },
//     cardGap: {
//         type: ControlType.Number,
//         title: "Card Gap",
//         min: 0,
//         max: 48,
//         step: 1,
//         defaultValue: 16,
//         unit: "px",
//         displayStepper: false,
//     },
// })
