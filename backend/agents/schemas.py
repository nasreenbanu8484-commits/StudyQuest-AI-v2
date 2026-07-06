from pydantic import BaseModel, Field

class AgentTraceStep(BaseModel):
    agent: str = Field(..., description="Name of the executing agent")
    action: str = Field(..., description="Specific action completed by the agent")
    output_summary: str = Field(..., description="Summary of the results or data outputs")
