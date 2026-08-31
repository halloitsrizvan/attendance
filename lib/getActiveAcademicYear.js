import dbConnect from "@/lib/mongodb";
import AcademicYear from "@/models/academicYearModel";

export async function getActiveAcademicYearId() {
  await dbConnect();
  try {
    const activeYear = await AcademicYear.findOne({
      $or: [{ isActive: true }, { isCurrent: true }]
    });
    return activeYear ? activeYear._id : null;
  } catch (error) {
    console.error("Error fetching active academic year:", error);
    return null;
  }
}
